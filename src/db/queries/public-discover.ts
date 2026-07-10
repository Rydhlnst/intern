import "server-only"

import { unstable_cache } from "next/cache"
import { and, desc, eq, type SQL } from "drizzle-orm"

import {
  coverTones,
  toCategorySlug,
  type CategoryItem,
  type DiscoverBook,
} from "@/lib/discover-data"
import { books } from "@/db/schema"
import {
  buildBookSearchCondition,
  fromBooksCatalogQuery,
  getDiscoverBookSelect,
  loadCatalogCategories,
} from "@/db/queries/helpers/book-catalog"
import { extractText } from "@/lib/tiptap/extract-text"
import type { TiptapDoc } from "@/lib/tiptap/types"

type PublicBookRow = {
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

export type PublicDiscoverPageData = {
  books: DiscoverBook[]
  categories: CategoryItem[]
  featuredBook: DiscoverBook | null
  query: string
  selectedCategorySlug: string
  selectedCategoryLabel: string | null
}

function normalizeQuery(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, 80)
}

function toPublicationYear(value: string | Date) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recent"
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date)
}

function toDiscoverBook(row: PublicBookRow, index: number): DiscoverBook {
  const preview = extractText(row.description, 180)

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    category: row.categoryName,
    categorySlug: toCategorySlug(row.categoryName),
    description: preview || `Published by ${row.publisher}.`,
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

const getCachedPublicDiscoverPageData = unstable_cache(
  async (query: string, requestedCategorySlug: string) => {
    const categories = await loadCatalogCategories()
    const selectedCategory = categories.find((category) => category.slug === requestedCategorySlug) ?? null

    const conditions: Array<SQL | undefined> = []
    if (selectedCategory) {
      conditions.push(eq(books.categoryId, selectedCategory.id))
    }

    if (query) {
      conditions.push(buildBookSearchCondition(query))
    }

    const where = conditions.length > 0 ? and(...conditions.filter(Boolean) as SQL[]) : undefined

    const rows = await fromBooksCatalogQuery(getDiscoverBookSelect(), { withRatings: true })
      .where(where)
      .orderBy(desc(books.createdAt))
      .limit(24)

    const mappedBooks = (rows as unknown as PublicBookRow[]).map((row, index) => toDiscoverBook(row, index))

    return {
      books: mappedBooks,
      categories,
      featuredBook: mappedBooks[0] ?? null,
      query,
      selectedCategorySlug: selectedCategory?.slug ?? "all",
      selectedCategoryLabel: selectedCategory?.label ?? null,
    } satisfies PublicDiscoverPageData
  },
  ["public-discover-page-data"],
  { revalidate: 300, tags: ["public-discover"] }
)

const getCachedPublicCategoryPageData = unstable_cache(
  async () => {
    const categories = await loadCatalogCategories()
    return { categories }
  },
  ["public-category-page-data"],
  { revalidate: 300, tags: ["public-discover"] }
)

export async function getPublicDiscoverPageData(input?: {
  query?: string
  categorySlug?: string
}) {
  return getCachedPublicDiscoverPageData(
    normalizeQuery(input?.query),
    input?.categorySlug?.trim() || "all"
  )
}

export async function getPublicCategoryPageData() {
  return getCachedPublicCategoryPageData()
}
