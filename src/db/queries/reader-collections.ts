import "server-only"

import { and, count, desc, eq } from "drizzle-orm"

import { coverTones, toCategorySlug, type DiscoverBook, type ReaderActivity } from "@/lib/discover-data"
import { db } from "@/db"
import {
  bookCategories,
  books,
  bookCopies,
  loans,
  members,
  readerBookmarks,
  readerFavorites,
  readerHistory,
  users,
} from "@/db/schema"
import {
  fromReaderCatalogQuery,
  getDiscoverBookSelect,
} from "@/db/queries/helpers/book-catalog"
import { getPagination, paginated, type Paginated } from "@/lib/pagination"
import { extractText } from "@/lib/tiptap/extract-text"
import type { TiptapDoc } from "@/lib/tiptap/types"

type CollectionBookRow = {
  id: number
  title: string
  author: string
  publisher: string
  categoryName: string
  description: TiptapDoc | null
  publicationDate: string | Date
  availableCopies: number
  totalCopies: number
  coverUrl: string | null
  avgRating: number
  reviewCount: number
}

function toPublicationYear(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recent"
  return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date)
}

function toDiscoverBook(row: CollectionBookRow, index: number): DiscoverBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    category: row.categoryName,
    categorySlug: toCategorySlug(row.categoryName),
    description: extractText(row.description, 180) || `Published by ${row.publisher}.`,
    publicationYear: toPublicationYear(row.publicationDate),
    availableCopies: Number(row.availableCopies ?? 0),
    totalCopies: Number(row.totalCopies ?? 0),
    coverUrl: row.coverUrl ?? null,
    hasCover: Boolean(row.coverUrl),
    tone: coverTones[index % coverTones.length],
    avgRating: Number(row.avgRating ?? 0),
    reviewCount: Number(row.reviewCount ?? 0),
  }
}

export async function getBookmarks(userId: string, page = 1): Promise<Paginated<DiscoverBook>> {
  const params = getPagination({ page })
  const sel = getDiscoverBookSelect()

  const [rows, totalResult] = await Promise.all([
    fromReaderCatalogQuery(readerBookmarks, readerBookmarks.bookId, sel, { withRatings: true })
      .where(eq(readerBookmarks.userId, userId))
      .orderBy(desc(readerBookmarks.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({ c: count() }).from(readerBookmarks).where(eq(readerBookmarks.userId, userId)),
  ])

  const items: DiscoverBook[] = (rows as unknown as CollectionBookRow[]).map((row, i) => toDiscoverBook(row, i))
  return paginated(items, totalResult[0]?.c ?? 0, params)
}

export async function getFavorites(userId: string, page = 1): Promise<Paginated<DiscoverBook>> {
  const params = getPagination({ page })
  const sel = getDiscoverBookSelect()

  const [rows, totalResult] = await Promise.all([
    fromReaderCatalogQuery(readerFavorites, readerFavorites.bookId, sel, { withRatings: true })
      .where(eq(readerFavorites.userId, userId))
      .orderBy(desc(readerFavorites.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({ c: count() }).from(readerFavorites).where(eq(readerFavorites.userId, userId)),
  ])

  const items: DiscoverBook[] = (rows as unknown as CollectionBookRow[]).map((row, i) => toDiscoverBook(row, i))
  return paginated(items, totalResult[0]?.c ?? 0, params)
}

export async function getReaderHistory(userId: string, page = 1) {
  const params = getPagination({ page, limit: 20 })

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: readerHistory.id,
        bookId: readerHistory.bookId,
        action: readerHistory.action,
        query: readerHistory.query,
        createdAt: readerHistory.createdAt,
        title: books.title,
        author: books.author,
        categoryName: bookCategories.name,
      })
      .from(readerHistory)
      .leftJoin(books, eq(readerHistory.bookId, books.id))
      .leftJoin(bookCategories, eq(books.categoryId, bookCategories.id))
      .where(eq(readerHistory.userId, userId))
      .orderBy(desc(readerHistory.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({ c: count() }).from(readerHistory).where(eq(readerHistory.userId, userId)),
  ])

  const items = rows.map((row, index) => ({
    id: row.id,
    bookId: row.bookId,
    action: row.action,
    title: row.title ?? "Library Search",
    author: row.author ?? "Reader Session",
    category: row.categoryName ?? "Search",
    categorySlug: row.categoryName ? toCategorySlug(row.categoryName) : "search",
    query: row.query ?? "",
    createdAt: row.createdAt.toISOString(),
    tone: coverTones[index % coverTones.length],
  })) satisfies ReaderActivity[]

  return paginated(items, totalResult[0]?.c ?? 0, params)
}

export async function isBookmarked(userId: string, bookId: number) {
  const result = await db
    .select({ id: readerBookmarks.id })
    .from(readerBookmarks)
    .where(and(eq(readerBookmarks.userId, userId), eq(readerBookmarks.bookId, bookId)))
    .limit(1)
  return result.length > 0
}

export async function isFavorited(userId: string, bookId: number) {
  const result = await db
    .select({ id: readerFavorites.id })
    .from(readerFavorites)
    .where(and(eq(readerFavorites.userId, userId), eq(readerFavorites.bookId, bookId)))
    .limit(1)
  return result.length > 0
}

export type BorrowRecord = {
  id: number
  bookId: number
  bookTitle: string
  bookAuthor: string
  bookCoverUrl: string | null
  copyCode: string
  borrowedAt: string
  dueDate: string
  returnedAt: string | null
  status: "borrowed" | "returned" | "overdue"
}

export async function getUserBorrowHistory(userId: string): Promise<BorrowRecord[]> {
  const user = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user[0]) return []

  const member = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, user[0].email))
    .limit(1)

  if (!member[0]) return []

  const rows = await db
    .select({
      id: loans.id,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverUrl: books.coverUrl,
      copyCode: bookCopies.copyCode,
      borrowedAt: loans.borrowedAt,
      dueDate: loans.dueDate,
      returnedAt: loans.returnedAt,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .where(eq(loans.memberId, member[0].id))
    .orderBy(desc(loans.borrowedAt))
    .limit(30)

  return rows.map((r) => ({
    id: r.id,
    bookId: r.bookId,
    bookTitle: r.bookTitle,
    bookAuthor: r.bookAuthor,
    bookCoverUrl: r.bookCoverUrl,
    copyCode: r.copyCode,
    borrowedAt: r.borrowedAt,
    dueDate: r.dueDate,
    returnedAt: r.returnedAt,
    status: r.status as BorrowRecord["status"],
  }))
}
