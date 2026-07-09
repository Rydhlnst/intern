import { db } from "@/db";
import { books, bookCategories, bookCopies, loans, members } from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getPagination, paginated } from "@/lib/pagination";

export type BookFilters = {
  search?: string;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  availability?: "available" | "unavailable";
  hasCover?: boolean;
  page?: number | string;
  limit?: number | string;
};

// Per-book copy tallies, computed in one grouped pass to avoid N+1.
const copyAgg = db
  .select({
    bookId: bookCopies.bookId,
    total: count().as("total_copies"),
    available:
      sql<number>`count(*) filter (where ${bookCopies.status} = 'available')`.as(
        "available_copies"
      ),
    borrowed:
      sql<number>`count(*) filter (where ${bookCopies.status} = 'borrowed')`.as(
        "borrowed_copies"
      ),
  })
  .from(bookCopies)
  .groupBy(bookCopies.bookId)
  .as("copy_agg");

function buildBookWhere(filters: BookFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conds.push(
      or(
        ilike(books.title, term),
        ilike(books.author, term),
        ilike(books.publisher, term),
        ilike(books.isbn, term)
      )
    );
  }
  if (filters.categoryId) conds.push(eq(books.categoryId, filters.categoryId));
  if (filters.startDate) conds.push(gte(books.publicationDate, filters.startDate));
  if (filters.endDate) conds.push(lte(books.publicationDate, filters.endDate));
  if (filters.hasCover === true) conds.push(isNotNull(books.coverUrl));
  if (filters.hasCover === false) conds.push(isNull(books.coverUrl));
  if (filters.availability === "available") {
    conds.push(sql`coalesce(${copyAgg.available}, 0) > 0`);
  }
  if (filters.availability === "unavailable") {
    conds.push(sql`coalesce(${copyAgg.available}, 0) = 0`);
  }

  return conds.length ? and(...conds) : undefined;
}

export async function getBooks(filters: BookFilters = {}) {
  const { page, limit, offset } = getPagination(filters);
  const where = buildBookWhere(filters);

  const rowsPromise = db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      isbn: books.isbn,
      publicationDate: books.publicationDate,
      publisher: books.publisher,
      numberOfPages: books.numberOfPages,
      coverUrl: books.coverUrl,
      createdAt: books.createdAt,
      categoryId: books.categoryId,
      categoryName: bookCategories.name,
      totalCopies: sql<number>`coalesce(${copyAgg.total}, 0)`,
      availableCopies: sql<number>`coalesce(${copyAgg.available}, 0)`,
      borrowedCopies: sql<number>`coalesce(${copyAgg.borrowed}, 0)`,
    })
    .from(books)
    .innerJoin(bookCategories, eq(books.categoryId, bookCategories.id))
    .leftJoin(copyAgg, eq(copyAgg.bookId, books.id))
    .where(where)
    .orderBy(desc(books.createdAt))
    .limit(limit)
    .offset(offset);

  const totalPromise = db
    .select({ c: count() })
    .from(books)
    .leftJoin(copyAgg, eq(copyAgg.bookId, books.id))
    .where(where);

  const [rows, totalRes] = await Promise.all([rowsPromise, totalPromise]);
  return paginated(rows, totalRes[0]?.c ?? 0, { page, limit, offset });
}

export async function getBookById(id: number) {
  const [book] = await db
    .select({
      id: books.id,
      categoryId: books.categoryId,
      categoryName: bookCategories.name,
      title: books.title,
      author: books.author,
      isbn: books.isbn,
      publicationDate: books.publicationDate,
      publisher: books.publisher,
      numberOfPages: books.numberOfPages,
      description: books.description,
      coverUrl: books.coverUrl,
      coverObjectKey: books.coverObjectKey,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .innerJoin(bookCategories, eq(books.categoryId, bookCategories.id))
    .where(eq(books.id, id))
    .limit(1);

  if (!book) return null;

  const copies = await db
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.bookId, id))
    .orderBy(bookCopies.copyCode);

  const totalCopies = copies.length;
  const availableCopies = copies.filter((c) => c.status === "available").length;
  const borrowedCopies = copies.filter((c) => c.status === "borrowed").length;

  const latestLoans = await db
    .select({
      id: loans.id,
      status: loans.status,
      borrowedAt: loans.borrowedAt,
      dueDate: loans.dueDate,
      returnedAt: loans.returnedAt,
      copyCode: bookCopies.copyCode,
      memberName: members.name,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(members, eq(loans.memberId, members.id))
    .where(eq(bookCopies.bookId, id))
    .orderBy(desc(loans.createdAt))
    .limit(10);

  return {
    ...book,
    copies,
    totalCopies,
    availableCopies,
    borrowedCopies,
    latestLoans,
  };
}
