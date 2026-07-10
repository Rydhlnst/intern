import "server-only"

import { desc, eq, count } from "drizzle-orm"

import {
  coverTones,
  toCategorySlug,
  type DiscoverBook,
  type ReaderActivity,
  type ReaderStats,
  type UserProfile,
} from "@/lib/discover-data"
import { db } from "@/db"
import {
  bookCategories,
  books,
  readerBookmarks,
  readerFavorites,
  readerHistory,
  users,
} from "@/db/schema"
import {
  fromBooksCatalogQuery,
  fromReaderCatalogQuery,
  getDiscoverBookSelect,
  loadCatalogCategories,
} from "@/db/queries/helpers/book-catalog"
import { extractText } from "@/lib/tiptap/extract-text"
import type { TiptapDoc } from "@/lib/tiptap/types"

type HistoryRow = {
  id: number
  bookId: number | null
  action: string
  query: string | null
  createdAt: Date
  title: string | null
  author: string | null
  categoryName: string | null
}

type DiscoverBookRow = {
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function toPublicationYear(value: string | Date) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recent"
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date)
}

function toRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function toDiscoverBook(row: DiscoverBookRow, index: number): DiscoverBook {
  const preview = extractText(row.description, 200)

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    category: row.categoryName,
    categorySlug: toCategorySlug(row.categoryName),
    description: preview || "Curated from the live library catalog.",
    publicationYear: toPublicationYear(row.publicationDate),
    availableCopies: row.availableCopies,
    totalCopies: row.totalCopies,
    coverUrl: row.coverUrl ?? null,
    hasCover: Boolean(row.coverUrl),
    tone: coverTones[index % coverTones.length],
    avgRating: Number(row.avgRating ?? 0),
    reviewCount: Number(row.reviewCount ?? 0),
  }
}

function toActivityLabel(action: string) {
  switch (action) {
    case "bookmarked":
      return "Bookmarked"
    case "favorited":
      return "Favorited"
    case "searched":
      return "Searched"
    default:
      return "Viewed"
  }
}

export async function getDiscoverPageData(userId?: string | null) {
  const discoverBookSelect = getDiscoverBookSelect()

  const recommendedBooksPromise = fromBooksCatalogQuery(discoverBookSelect, {
    withRatings: true,
  })
    .orderBy(desc(books.createdAt))
    .limit(100)

  const categoriesPromise = loadCatalogCategories()

  const profilePromise = userId
    ? db.query.users.findFirst({ where: eq(users.id, userId) })
    : Promise.resolve(null)

  const bookmarkRowsPromise = userId
    ? fromReaderCatalogQuery(
        readerBookmarks,
        readerBookmarks.bookId,
        discoverBookSelect,
        { withRatings: true }
      )
        .where(eq(readerBookmarks.userId, userId))
        .orderBy(desc(readerBookmarks.createdAt))
        .limit(6)
    : Promise.resolve([] as DiscoverBookRow[])

  const favoriteRowsPromise = userId
    ? fromReaderCatalogQuery(
        readerFavorites,
        readerFavorites.bookId,
        discoverBookSelect,
        { withRatings: true }
      )
        .where(eq(readerFavorites.userId, userId))
        .orderBy(desc(readerFavorites.createdAt))
        .limit(6)
    : Promise.resolve([] as DiscoverBookRow[])

  const historyRowsPromise = userId
    ? db
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
        .limit(8)
    : Promise.resolve(
        [] as Array<{
          id: number
          bookId: number | null
          action: string
          query: string | null
          createdAt: Date
          title: string | null
          author: string | null
          categoryName: string | null
        }>
      )

  const bookmarkCountPromise = userId
    ? db.select({ c: count() }).from(readerBookmarks).where(eq(readerBookmarks.userId, userId))
    : Promise.resolve([{ c: 0 }])

  const favoriteCountPromise = userId
    ? db.select({ c: count() }).from(readerFavorites).where(eq(readerFavorites.userId, userId))
    : Promise.resolve([{ c: 0 }])

  const historyCountPromise = userId
    ? db.select({ c: count() }).from(readerHistory).where(eq(readerHistory.userId, userId))
    : Promise.resolve([{ c: 0 }])

  const [
    recommendedRows,
    categories,
    profile,
    bookmarkRows,
    favoriteRows,
    historyRows,
    bookmarkCountResult,
    favoriteCountResult,
    historyCountResult,
  ] = await Promise.all([
    recommendedBooksPromise,
    categoriesPromise,
    profilePromise,
    bookmarkRowsPromise,
    favoriteRowsPromise,
    historyRowsPromise,
    bookmarkCountPromise,
    favoriteCountPromise,
    historyCountPromise,
  ])

  const recommendedBooks = (recommendedRows as unknown as DiscoverBookRow[]).map((row, index) => toDiscoverBook(row, index))
  const bookmarks = (bookmarkRows as unknown as DiscoverBookRow[]).map((row, index) => toDiscoverBook(row, index + 1))
  const favorites = (favoriteRows as unknown as DiscoverBookRow[]).map((row, index) => toDiscoverBook(row, index + 2))
  const history = (historyRows as unknown as HistoryRow[]).map((row, index) => ({
    id: row.id,
    bookId: row.bookId,
    action: toActivityLabel(row.action),
    title: row.title ?? "Library Search",
    author: row.author ?? "Reader Session",
    category: row.categoryName ?? "Search",
    categorySlug: row.categoryName ? toCategorySlug(row.categoryName) : "search",
    query: row.query ?? "",
    createdAt: row.createdAt.toISOString(),
    tone: coverTones[index % coverTones.length],
  })) satisfies ReaderActivity[]

  const readerStats: ReaderStats = {
    bookmarkCount: bookmarkCountResult[0]?.c ?? 0,
    favoriteCount: favoriteCountResult[0]?.c ?? 0,
    historyCount: historyCountResult[0]?.c ?? 0,
  }

  const userProfile: UserProfile = profile
    ? {
        name: profile.name,
        role: toRoleLabel(profile.role),
        initials: getInitials(profile.name),
      }
    : {
        name: "Guest Reader",
        role: "Public Reader",
        initials: "GR",
      }

  return {
    profile: userProfile,
    categories,
    featuredBook: favorites[0] ?? bookmarks[0] ?? recommendedBooks[0] ?? null,
    recommendedBooks,
    readerCollections: {
      bookmarks,
      favorites,
      history,
    },
    readerStats,
  }
}

export type DiscoverPageData = Awaited<ReturnType<typeof getDiscoverPageData>>
