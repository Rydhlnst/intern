export type NavItem = {
  id: string
  label: string
  icon: string
  group: "primary" | "secondary"
  count?: number
}

export type DiscoverBook = {
  id: number
  title: string
  author: string
  category: string
  categorySlug: string
  description: string
  publicationYear: string
  availableCopies: number
  totalCopies: number
  coverUrl: string | null
  hasCover: boolean
  tone: string
  avgRating: number
  reviewCount: number
}

export type CategoryItem = {
  id: number
  label: string
  slug: string
  count: number
  tone: string
}

export type ReaderActivity = {
  id: number
  bookId?: number | null
  action: string
  title: string
  author: string
  category: string
  categorySlug: string
  query: string
  createdAt: string
  tone: string
}

export type UserProfile = {
  name: string
  role: string
  initials: string
}

export type ReaderStats = {
  bookmarkCount: number
  favoriteCount: number
  historyCount: number
}

export const coverTones = [
  "cover-1",
  "cover-2",
  "cover-3",
  "cover-4",
  "cover-5",
  "cover-6",
  "cover-7",
  "cover-8",
] as const

export const categoryTones = [
  "cover-5",
  "cover-6",
  "cover-7",
  "cover-8",
] as const

export const primaryNavItems: NavItem[] = [
  { id: "discover", label: "Discover", icon: "compass", group: "primary" },
  { id: "category", label: "Category", icon: "grid", group: "primary" },
  { id: "library", label: "My Library", icon: "library", group: "primary" },
  { id: "download", label: "Download", icon: "download", group: "primary" },
  { id: "bookmark", label: "Bookmark", icon: "bookmark", group: "primary" },
  { id: "favorite", label: "Favorite", icon: "heart", group: "primary" },
  { id: "history", label: "History", icon: "history", group: "primary" },
]

export const secondaryNavItems: NavItem[] = [
  { id: "settings", label: "Setting", icon: "settings", group: "secondary" },
  { id: "help", label: "Help", icon: "help", group: "secondary" },
  { id: "logout", label: "Log out", icon: "logout", group: "secondary" },
]

export const collectionHeadings = {
  discover: {
    title: "Book Recommendation",
    description: "Fresh catalog picks matched to the same calm, editorial layout as the reference.",
  },
  category: {
    title: "Browse Categories",
    description: "Filter the library collection by category, cover availability, and personal search intent.",
  },
  library: {
    title: "My Library",
    description: "A merged shelf of saved and loved books for the current reader profile.",
  },
  download: {
    title: "Download Center",
    description: "Offline access and export tools are reserved here while the reusable placeholder pattern carries the unfinished state.",
  },
  bookmark: {
    title: "Bookmarks",
    description: "Quick-access books the reader wants to return to later.",
  },
  favorite: {
    title: "Favorites",
    description: "Personal top picks surfaced in the same discover experience.",
  },
  history: {
    title: "Reading History",
    description: "Recent reader actions, searches, and book visits in one place.",
  },
} as const

export function toCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function fromSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? ""
  }

  return value?.trim() ?? ""
}
