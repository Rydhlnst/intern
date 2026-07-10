import { db } from "@/db";
import { books, bookCategories, bookCopies, loans, members } from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { getPagination, paginated } from "@/lib/pagination";
import {
  bookCatalogCopyAgg,
  buildBookSearchCondition,
  fromBooksCatalogQuery,
  getDashboardBookListSelect,
} from "@/db/queries/helpers/book-catalog";

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

function buildBookWhere(filters: BookFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];

  if (filters.search) {
    conds.push(buildBookSearchCondition(filters.search, { includeIsbn: true }));
  }
  if (filters.categoryId) conds.push(eq(books.categoryId, filters.categoryId));
  if (filters.startDate) conds.push(gte(books.publicationDate, filters.startDate));
  if (filters.endDate) conds.push(lte(books.publicationDate, filters.endDate));
  if (filters.hasCover === true) conds.push(isNotNull(books.coverUrl));
  if (filters.hasCover === false) conds.push(isNull(books.coverUrl));
  if (filters.availability === "available") {
    conds.push(sql`coalesce(${bookCatalogCopyAgg.availableCopies}, 0) > 0`);
  }
  if (filters.availability === "unavailable") {
    conds.push(sql`coalesce(${bookCatalogCopyAgg.availableCopies}, 0) = 0`);
  }

  return conds.length ? and(...conds) : undefined;
}

export async function getBooks(filters: BookFilters = {}) {
  const { page, limit, offset } = getPagination(filters);
  const where = buildBookWhere(filters);

  const rowsPromise = fromBooksCatalogQuery(getDashboardBookListSelect())
    .where(where)
    .orderBy(desc(books.createdAt))
    .limit(limit)
    .offset(offset);

  const totalPromise = fromBooksCatalogQuery({ c: count() }).where(where);

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
