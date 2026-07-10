import Link from "next/link"
import { Star } from "lucide-react"

import type { DiscoverBook } from "@/lib/discover-data"
import { cn } from "@/lib/utils"

const toneClassMap: Record<string, string> = {
  "cover-1": "bg-[var(--book-cover-1)] text-foreground",
  "cover-2": "bg-[var(--book-cover-2)] text-foreground",
  "cover-3": "bg-[var(--book-cover-3)] text-foreground",
  "cover-4": "bg-[var(--book-cover-4)] text-white",
  "cover-5": "bg-[var(--book-cover-5)] text-white",
  "cover-6": "bg-[var(--book-cover-6)] text-foreground",
  "cover-7": "bg-[var(--book-cover-7)] text-white",
  "cover-8": "bg-[var(--book-cover-8)] text-white",
}

type CollectionBookCardProps = {
  book: DiscoverBook
}

function CollectionBookCard({ book }: CollectionBookCardProps) {
  const toneClass = toneClassMap[book.tone] ?? "bg-gray-100 text-gray-800"

  return (
    <Link
      href={`/books/${book.id}`}
      className="group focus:outline-none focus-visible:outline-none"
    >
      <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden">
          {book.hasCover && book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn("w-full h-full flex flex-col justify-between p-3", toneClass)}>
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

      <div className="mt-3 px-0.5">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate group-hover:text-[var(--library-accent)] transition-colors">
          {book.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{book.author}</p>
        {book.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] text-gray-400">
              {book.avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

type PublicCollectionGridProps = {
  books: DiscoverBook[]
  currentPage?: number
  totalPages?: number
}

export function PublicCollectionGrid({ books, currentPage, totalPages }: PublicCollectionGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {books.map((book) => (
          <CollectionBookCard key={book.id} book={book} />
        ))}
      </div>

      {totalPages && totalPages > 1 && currentPage && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`?page=${currentPage - 1}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-gray-400">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?page=${currentPage + 1}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  )
}
