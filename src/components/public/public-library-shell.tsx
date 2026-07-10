"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  BookOpen,
  Bookmark,
  ChevronRight,
  Compass,
  Download,
  Grid2x2,
  Heart,
  HelpCircle,
  History,
  Library,
  LogOut,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react"

import {
  type CategoryItem,
  type DiscoverBook,
  primaryNavItems,
  secondaryNavItems,
} from "@/lib/discover-data"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// ─── Tone map ────────────────────────────────────────────────────────────────

const toneClassMap = {
  "cover-1": "bg-[var(--book-cover-1)] text-foreground",
  "cover-2": "bg-[var(--book-cover-2)] text-foreground",
  "cover-3": "bg-[var(--book-cover-3)] text-foreground",
  "cover-4": "bg-[var(--book-cover-4)] text-white",
  "cover-5": "bg-[var(--book-cover-5)] text-white",
  "cover-6": "bg-[var(--book-cover-6)] text-foreground",
  "cover-7": "bg-[var(--book-cover-7)] text-white",
  "cover-8": "bg-[var(--book-cover-8)] text-white",
} as const

const navIconMap = {
  compass: Compass,
  grid: Grid2x2,
  library: Library,
  download: Download,
  bookmark: Bookmark,
  heart: Heart,
  history: History,
  settings: Settings,
  help: HelpCircle,
  logout: LogOut,
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

type PublicLibraryShellProps = {
  activeNav: string
  title?: string
  description?: string
  books?: DiscoverBook[]
  categories?: CategoryItem[]
  query?: string
  selectedCategorySlug?: string
  selectedCategoryLabel?: string | null
  variant?: "discover" | "categories" | "download"
  user?: { name: string; email: string; role: string } | null
  children?: React.ReactNode
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function PublicLibraryShell({
  activeNav,
  books = [],
  categories = [],
  query = "",
  selectedCategorySlug = "all",
  variant = "discover",
  user = null,
  children,
}: PublicLibraryShellProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = React.useState(query)
  const [activeCategorySlug, setActiveCategorySlug] = React.useState(selectedCategorySlug)
  const [selectedBook, setSelectedBook] = React.useState<DiscoverBook | null>(books[0] ?? null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Track the last-seen URL-derived props so we can reset local state during
  // render when navigation changes them (avoids the cascading re-render of
  // calling setState inside useEffect).
  const [syncedQuery, setSyncedQuery] = React.useState(query)
  const [syncedCategorySlug, setSyncedCategorySlug] = React.useState(selectedCategorySlug)

  if (syncedQuery !== query || syncedCategorySlug !== selectedCategorySlug) {
    setSyncedQuery(query)
    setSyncedCategorySlug(selectedCategorySlug)
    setSearchInput(query)
    setActiveCategorySlug(selectedCategorySlug)
    setSelectedBook(books[0] ?? null)
  }

  function buildHref(cat: string, q: string) {
    const params = new URLSearchParams()
    if (cat && cat !== "all") params.set("category", cat)
    if (q.trim()) params.set("q", q.trim())
    const qs = params.toString()
    return qs ? `/discover?${qs}` : "/discover"
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildHref(activeCategorySlug, searchInput))
  }

  function handleCategorySelect(slug: string) {
    setActiveCategorySlug(slug)
    router.push(buildHref(slug, searchInput))
  }

  function handleBookSelect(book: DiscoverBook) {
    setSelectedBook(book)
    // Only open the mobile sheet on narrow viewports — on md+ the right aside
    // handles the selection, so opening the sheet would render a full-page
    // Radix overlay and blur the desktop content.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSheetOpen(true)
    }
  }

  const featuredBook = selectedBook ?? books[0] ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--library-shell)]">
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-white border-r border-gray-100 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/discover" className="block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--library-ink-soft)]">
              Public
            </p>
            <p className="text-sm font-bold tracking-tight text-foreground">
              Intern Library
            </p>
          </Link>
        </div>

        {/* Primary nav — auth-only items hidden for guests */}
        <nav className="flex-1 px-3 space-y-0.5">
          {primaryNavItems
            .filter((item) =>
              user
                ? true
                : !["library", "bookmark", "favorite", "history"].includes(item.id)
            )
            .map((item) => {
            const Icon = navIconMap[item.icon as keyof typeof navIconMap] ?? Compass
            const isActive = activeNav === item.id
            const href =
              item.id === "discover" ? "/discover"
              : item.id === "category" ? "/discover/categories"
              : item.id === "download" ? "/discover/download"
              : item.id === "library" ? "/library"
              : item.id === "bookmark" ? "/bookmark"
              : item.id === "favorite" ? "/favorite"
              : item.id === "history" ? "/history"
              : "#"
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--library-accent)] text-[var(--library-accent-foreground)]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Secondary nav — logout only for authed users */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          {secondaryNavItems
            .filter((item) => (user ? true : item.id !== "logout"))
            .map((item) => {
            const Icon = navIconMap[item.icon as keyof typeof navIconMap] ?? Settings
            if (item.id === "logout") {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    await authClient.signOut()
                    router.push("/login")
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            }
            return (
              <Link
                key={item.id}
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* ── Right side ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-4 h-10 focus-within:border-[var(--library-accent)]/50 focus-within:bg-white transition-colors">
              <Search className="size-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search your favourite books"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); router.push(buildHref(activeCategorySlug, "")) }}
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-[var(--library-accent)] flex items-center justify-center text-xs font-semibold text-[var(--library-accent-foreground)]">
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name.split(" ")[0]}
                </span>
              </div>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-sm text-gray-600 hover:text-gray-900"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-[var(--library-accent)] hover:bg-[var(--library-accent)]/90 text-[var(--library-accent-foreground)] px-4"
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Content row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main scrollable content */}
          <main className={cn("flex-1 overflow-y-auto", children ? "bg-white" : "p-4 sm:p-6 space-y-5")}>
            {children ?? (<>
            {variant === "download" && (
              <section className="bg-white rounded-2xl p-10 shadow-sm ring-1 ring-black/5 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <div className="size-16 rounded-2xl bg-[var(--library-highlight-soft)] flex items-center justify-center mb-5">
                  <Download className="size-7 text-[var(--library-accent)]" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--library-accent)] mb-2">
                  On Building
                </p>
                <h2 className="text-2xl font-bold tracking-tight mb-3">
                  Offline downloads are coming soon
                </h2>
                <p className="max-w-md text-sm text-gray-500 mb-6">
                  We&apos;re preparing packaged reading files so you can take
                  the library with you on the road. In the meantime, keep
                  browsing the catalog.
                </p>
                <Button
                  asChild
                  className="rounded-full bg-[var(--library-accent)] hover:bg-[var(--library-accent)]/90 text-[var(--library-accent-foreground)] px-6"
                >
                  <Link href="/discover">Back to Discover</Link>
                </Button>
              </section>
            )}

            {variant === "categories" && (
              <>
                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm ring-1 ring-black/5">
                  <div className="mb-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--library-accent)]">
                      {categories.length} shelves ready
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">
                      Pick a shelf, find your next read
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Every category groups the catalog by mood and theme —
                      tap one to jump straight to matching titles.
                    </p>
                  </div>

                  {categories.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                      No categories available yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categories.map((cat, index) => (
                        <CategoryCard
                          key={cat.id}
                          category={cat}
                          index={index}
                          isActive={activeCategorySlug === cat.slug}
                          query={searchInput}
                          buildHref={buildHref}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Distinct-from-discover second section: shelf leaderboard */}
                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm ring-1 ring-black/5">
                  <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--library-accent)]">
                        Shelf leaderboard
                      </p>
                      <h2 className="mt-1 text-lg font-bold tracking-tight">
                        Which shelves the reading room hits hardest
                      </h2>
                    </div>
                    <span className="text-xs text-gray-400">
                      Ranked by number of titles in the catalog
                    </span>
                  </div>

                  {categories.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No shelf data yet.
                    </div>
                  ) : (
                    <ol className="divide-y divide-gray-100">
                      {[...categories]
                        .sort((a, b) => b.count - a.count)
                        .map((cat, idx) => {
                          const max = Math.max(
                            ...categories.map((c) => c.count),
                            1
                          )
                          const pct = Math.round((cat.count / max) * 100)
                          return (
                            <li key={cat.id} className="py-3 flex items-center gap-4">
                              <span className="w-6 text-sm font-semibold tabular-nums text-gray-400">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <Link
                                href={buildHref(cat.slug, "")}
                                className="min-w-0 flex-1"
                              >
                                <p className="text-sm font-semibold text-gray-900 truncate hover:text-[var(--library-accent)] transition-colors">
                                  {cat.label}
                                </p>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[var(--library-accent)]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </Link>
                              <span className="text-xs font-medium text-gray-500 tabular-nums shrink-0">
                                {cat.count}{" "}
                                {cat.count === 1 ? "title" : "titles"}
                              </span>
                            </li>
                          )
                        })}
                    </ol>
                  )}
                </section>
              </>
            )}

            {variant === "discover" && (
              <>
            <section className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
              <div className="mb-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--library-accent)]">
                  Fresh on the shelf
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">
                    Handpicked for you this week
                  </h2>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-[var(--library-accent)] hover:text-[var(--library-accent)] hover:bg-[var(--library-highlight-soft)] rounded-full text-xs font-medium gap-0.5 px-3"
                >
                  <Link href="/discover">
                    See All <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
                </div>
              </div>

              {books.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No books in the catalog yet.
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pt-2 pb-4 px-2 -mx-2 scrollbar-hide">
                  {books.slice(0, 12).map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isSelected={selectedBook?.id === book.id}
                      onSelect={handleBookSelect}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ── Categories — one row of category cards, 3 visible ─────── */}
            <section className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--library-accent)]">
                  Browse by mood
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">
                    Explore the shelves
                  </h2>
                  <Badge variant="outline" className="rounded-full text-xs text-gray-400 border-gray-200">
                    {categories.length} shelves
                  </Badge>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
                <button
                  type="button"
                  onClick={() => handleCategorySelect("all")}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    activeCategorySlug === "all"
                      ? "bg-[var(--library-accent)] text-[var(--library-accent-foreground)]"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                      activeCategorySlug === cat.slug
                        ? "bg-[var(--library-accent)] text-[var(--library-accent-foreground)]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Category cards — single row, 3 visible at once, scroll X */}
              {categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No categories available yet.
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pt-2 pb-2 px-2 -mx-2 scrollbar-hide">
                  {categories.map((cat, index) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      index={index}
                      isActive={activeCategorySlug === cat.slug}
                      query={searchInput}
                      buildHref={buildHref}
                    />
                  ))}
                </div>
              )}
            </section>
              </>
            )}
            </>)}
          </main>

          {/* ── Right detail panel — visible on md+ ───────────────────── */}
          {!children && variant !== "download" && featuredBook && (
            <aside className="hidden md:flex w-72 shrink-0 flex-col bg-[var(--library-panel)] text-foreground border-l border-gray-100 overflow-y-auto">
              <RightDetailPanel
                book={featuredBook}
                buildHref={buildHref}
                query={searchInput}
                categorySlug={activeCategorySlug}
              />
            </aside>
          )}
        </div>
      </div>

      {/* ── Mobile Sheet — visible only on < md ────────────────────────── */}
      {!children && variant !== "download" && featuredBook && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="bottom"
            className="md:hidden rounded-t-3xl p-0 bg-[var(--library-panel)] text-foreground border-l border-gray-100 border-0 max-h-[90dvh] overflow-y-auto"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">{featuredBook.title}</SheetTitle>
            <SheetDescription className="sr-only">Book detail for {featuredBook.title}</SheetDescription>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <RightDetailPanel
              book={featuredBook}
              buildHref={buildHref}
              query={searchInput}
              categorySlug={activeCategorySlug}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

// ─── Book card ────────────────────────────────────────────────────────────────

function BookCard({
  book,
  isSelected,
  onSelect,
}: {
  book: DiscoverBook
  isSelected: boolean
  onSelect: (book: DiscoverBook) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(book)}
      className="group shrink-0 w-44 text-left focus:outline-none focus-visible:outline-none"
    >
      {/* Card container */}
      <div
        className={cn(
          "rounded-2xl bg-white p-2.5 shadow-sm ring-1 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md",
          isSelected
            ? "ring-[var(--library-accent)] shadow-md shadow-[var(--library-accent)]/10"
            : "ring-black/5"
        )}
      >
        {/* Book cover — portrait 2:3 */}
        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden">
          {book.hasCover && book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex flex-col justify-between p-3",
                toneClassMap[book.tone as keyof typeof toneClassMap]
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60 leading-tight">
                {book.category}
              </span>
              <div>
                <p className="text-sm font-bold leading-snug line-clamp-2">{book.title}</p>
                <p className="mt-1 text-[11px] opacity-60 line-clamp-1">{book.author}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title & author below the card */}
      <div className="mt-3 px-0.5">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate group-hover:text-[var(--library-accent)] transition-colors">
          {book.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{book.author}</p>
      </div>
    </button>
  )
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  isActive,
  query,
  buildHref,
}: {
  category: CategoryItem
  index: number
  isActive: boolean
  query: string
  buildHref: (cat: string, q: string) => string
}) {
  const toneClass = toneClassMap[category.tone as keyof typeof toneClassMap] ?? "bg-gray-100 text-gray-800"

  return (
    <Link
      href={buildHref(category.slug, query)}
      className="group shrink-0 w-52 focus:outline-none focus-visible:outline-none"
    >
      <div
        className={cn(
          "rounded-2xl p-5 shadow-sm ring-1 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md h-36 flex flex-col justify-between",
          isActive
            ? "ring-[var(--library-accent)] shadow-md shadow-[var(--library-accent)]/15"
            : "ring-black/5",
          toneClass
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
            Category
          </p>
          {isActive && (
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
          )}
        </div>
        <div>
          <p className="text-base font-bold leading-snug line-clamp-2">
            {category.label}
          </p>
          <p className="mt-1.5 text-[12px] opacity-60">
            {category.count} {category.count === 1 ? "book" : "books"}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Right detail panel ───────────────────────────────────────────────────────

function RightDetailPanel({
  book,
  buildHref,
  query,
  categorySlug,
}: {
  book: DiscoverBook
  buildHref: (cat: string, q: string) => string
  query: string
  categorySlug: string
}) {
  return (
    <div className="flex flex-col">
      {/* Book cover */}
      <div className="px-6 pt-6 pb-5 flex justify-center">
        <div className="w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
          {book.hasCover && book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex flex-col justify-between p-4",
                toneClassMap[book.tone as keyof typeof toneClassMap]
              )}
            >
              <span className="text-[9px] font-semibold uppercase tracking-widest opacity-60">
                {book.category}
              </span>
              <div>
                <p className="text-sm font-bold leading-snug">{book.title}</p>
                <p className="mt-1 text-xs opacity-60">{book.author}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info body */}
      <div className="px-6 pb-8 space-y-5">
        {/* Title + author */}
        <div className="text-center">
          <h3 className="text-base font-bold leading-snug">{book.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{book.author}</p>
        </div>

        {/* Star rating */}
        {book.reviewCount > 0 && (
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "size-4",
                  n <= Math.round(book.avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                )}
              />
            ))}
            <span className="ml-1.5 text-sm font-semibold">{book.avgRating.toFixed(1)}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 bg-white rounded-2xl p-4">
          <div className="text-center">
            <p className="text-base font-bold">{book.totalCopies}</p>
            <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wider">Copies</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-base font-bold">{book.reviewCount}</p>
            <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wider">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold">{book.availableCopies}</p>
            <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wider">Free</p>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-center">
          <Badge
            className={cn(
              "rounded-full px-4 py-1 text-xs font-medium border-0",
              book.availableCopies > 0
                ? "bg-[var(--library-highlight-soft)] text-[var(--library-accent)]"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {book.availableCopies > 0
              ? `${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"} available`
              : "No copies available"}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-5 line-clamp-5">{book.description}</p>

        {/* Year */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Published</span>
          <span className="font-medium text-gray-600">{book.publicationYear}</span>
        </div>

        {/* Read Now CTA */}
        <Button
          asChild
          className="w-full rounded-full bg-[var(--library-accent)] hover:bg-[var(--library-highlight)] text-[var(--library-accent-foreground)] font-semibold gap-2 h-11"
        >
          <Link href={`/books/${book.id}`}>
            <BookOpen className="size-4" />
            Read Now
          </Link>
        </Button>

        {/* Back link */}
        <Link
          href={buildHref(categorySlug, query)}
          className="inline-flex items-center justify-center gap-1.5 w-full text-center text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          <ArrowLeftIcon className="size-3" />
          Back to {categorySlug !== "all" ? categorySlug : "all books"}
        </Link>
      </div>
    </div>
  )
}

// ─── Download placeholder ─────────────────────────────────────────────────────

export function DownloadPlaceholder() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card className="rounded-[28px] bg-white py-0 shadow-sm ring-1 ring-black/5">
        <CardContent className="space-y-4 p-6">
          <Badge className="w-fit rounded-full bg-[var(--library-highlight-soft)] px-3 py-1 text-[var(--library-accent)] hover:bg-[var(--library-highlight-soft)]">
            Coming soon
          </Badge>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Download Center</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--library-ink-soft)]">
              Offline packs, reader-safe export delivery, signed file links, and download history will be available here.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Offline packs per category", "Reader-safe export delivery", "Signed file links", "Download history and quotas"].map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--library-panel-strong)] p-4 text-sm text-[var(--library-ink-soft)]">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[28px] bg-white py-0 shadow-sm ring-1 ring-black/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--library-ink-soft)]">Current state</p>
          <h3 className="text-xl font-semibold tracking-tight">No file generation is running yet</h3>
          <p className="text-sm leading-6 text-[var(--library-ink-soft)]">
            The route exists now, but storage, entitlement checks, and generated file delivery should be added in a separate backend step.
          </p>
          <Button asChild className="rounded-full w-fit bg-[var(--library-accent)] hover:bg-[var(--library-highlight)] text-[var(--library-accent-foreground)]">
            <Link href="/discover">Back to Discover</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
