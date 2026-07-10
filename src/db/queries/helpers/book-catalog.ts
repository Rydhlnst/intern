import { count, eq, ilike, or, sql, type SQL } from "drizzle-orm"
import type { PgColumn } from "drizzle-orm/pg-core"
import type { SelectedFields } from "drizzle-orm/operations"

import {
  categoryTones,
  toCategorySlug,
  type CategoryItem,
} from "@/lib/discover-data"
import { db } from "@/db"
import {
  bookCategories,
  bookCopies,
  bookReviews,
  books,
  readerBookmarks,
  readerFavorites,
} from "@/db/schema"

export const bookCatalogCopyAgg = db
  .select({
    bookId: bookCopies.bookId,
    totalCopies: count().as("total_copies"),
    availableCopies:
      sql<number>`count(*) filter (where ${bookCopies.status} = 'available')`.as(
        "available_copies"
      ),
    borrowedCopies:
      sql<number>`count(*) filter (where ${bookCopies.status} = 'borrowed')`.as(
        "borrowed_copies"
      ),
  })
  .from(bookCopies)
  .groupBy(bookCopies.bookId)
  .as("book_catalog_copy_agg")

export const bookCatalogRatingAgg = db
  .select({
    bookId: bookReviews.bookId,
    avgRating: sql<number>`avg(${bookReviews.rating})`.as("avg_rating"),
    reviewCount: count().as("review_count"),
  })
  .from(bookReviews)
  .groupBy(bookReviews.bookId)
  .as("book_catalog_rating_agg")

export function getDiscoverBookSelect() {
  return {
    id: books.id,
    title: books.title,
    author: books.author,
    publisher: books.publisher,
    categoryName: bookCategories.name,
    description: books.description,
    publicationDate: books.publicationDate,
    availableCopies: sql<number>`coalesce(${bookCatalogCopyAgg.availableCopies}, 0)`,
    totalCopies: sql<number>`coalesce(${bookCatalogCopyAgg.totalCopies}, 0)`,
    coverUrl: books.coverUrl,
    avgRating: sql<number>`coalesce(${bookCatalogRatingAgg.avgRating}, 0)`,
    reviewCount: sql<number>`coalesce(${bookCatalogRatingAgg.reviewCount}, 0)`,
  }
}

export function getDashboardBookListSelect() {
  return {
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
    totalCopies: sql<number>`coalesce(${bookCatalogCopyAgg.totalCopies}, 0)`,
    availableCopies: sql<number>`coalesce(${bookCatalogCopyAgg.availableCopies}, 0)`,
    borrowedCopies: sql<number>`coalesce(${bookCatalogCopyAgg.borrowedCopies}, 0)`,
  }
}

export function fromBooksCatalogQuery<
  TSelection extends SelectedFields<PgColumn, typeof books>,
>(selection: TSelection, options?: { withRatings?: boolean }) {
  const query = db
    .select(selection)
    .from(books)
    .innerJoin(bookCategories, eq(books.categoryId, bookCategories.id))
    .leftJoin(bookCatalogCopyAgg, eq(bookCatalogCopyAgg.bookId, books.id))

  if (options?.withRatings) {
    return query.leftJoin(bookCatalogRatingAgg, eq(bookCatalogRatingAgg.bookId, books.id))
  }

  return query
}

type ReaderCatalogSource = typeof readerBookmarks | typeof readerFavorites
type ReaderCatalogSourceBookId =
  | typeof readerBookmarks.bookId
  | typeof readerFavorites.bookId

export function fromReaderCatalogQuery<
  TSelection extends SelectedFields<PgColumn, typeof books>,
>(
  source: ReaderCatalogSource,
  sourceBookId: ReaderCatalogSourceBookId,
  selection: TSelection,
  options?: { withRatings?: boolean }
) {
  const query = db
    .select(selection)
    .from(source)
    .innerJoin(books, eq(sourceBookId, books.id))
    .innerJoin(bookCategories, eq(books.categoryId, bookCategories.id))
    .leftJoin(bookCatalogCopyAgg, eq(bookCatalogCopyAgg.bookId, books.id))

  if (options?.withRatings) {
    return query.leftJoin(bookCatalogRatingAgg, eq(bookCatalogRatingAgg.bookId, books.id))
  }

  return query
}

export function buildBookSearchCondition(
  search: string,
  options?: { includeIsbn?: boolean }
): SQL {
  const term = `%${search}%`
  const conditions = [ilike(books.title, term), ilike(books.author, term), ilike(books.publisher, term)]

  if (options?.includeIsbn) {
    conditions.push(ilike(books.isbn, term))
  }

  return or(...conditions)!
}

export async function loadCatalogCategories() {
  const rows = await db
    .select({
      id: bookCategories.id,
      label: bookCategories.name,
      count: count(books.id),
    })
    .from(bookCategories)
    .leftJoin(books, eq(books.categoryId, bookCategories.id))
    .groupBy(bookCategories.id, bookCategories.name)
    .orderBy(bookCategories.name)

  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    slug: toCategorySlug(row.label),
    count: Number(row.count ?? 0),
    tone: categoryTones[index % categoryTones.length],
  })) satisfies CategoryItem[]
}
