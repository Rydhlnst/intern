import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, Star } from "lucide-react"

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

function CollectionBookCard({ book }: { book: DiscoverBook }) {
  const toneClass = toneClassMap[book.tone] ?? "bg-gray-100 text-gray-800"

  return (
    <Link href={`/books/${book.id}`} className="group focus:outline-none">
      {/* Cover */}
      <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
        {book.hasCover && book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className={cn("w-full h-full flex flex-col justify-between p-3", toneClass)}>
            <span className="text-[9px] font-semibold uppercase tracking-widest opacity-60 leading-tight">
              {book.category}
            </span>
            <div>
              <p className="text-xs font-bold leading-snug line-clamp-3">{book.title}</p>
              <p className="mt-1 text-[10px] opacity-60 line-clamp-1">{book.author}</p>
            </div>
          </div>
        )}
      </div>

      {/* Meta below cover */}
      <div className="mt-2.5">
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-[var(--library-accent)] transition-colors">
          {book.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{book.author}</p>
        {book.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] text-gray-400">{book.avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

type FlatCollectionGridProps = {
  books: DiscoverBook[]
  currentPage?: number
  totalPages?: number
  baseHref?: string
}

export function FlatCollectionGrid({ books, currentPage, totalPages, baseHref }: FlatCollectionGridProps) {
  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-7">
        {books.map((book) => (
          <CollectionBookCard key={book.id} book={book} />
        ))}
      </div>

      {totalPages && totalPages > 1 && currentPage && baseHref && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {currentPage > 1 && (
            <Link
              href={`${baseHref}?page=${currentPage - 1}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
              Sebelumnya
            </Link>
          )}
          <span className="text-sm text-gray-400">{currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link
              href={`${baseHref}?page=${currentPage + 1}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Berikutnya
              <ArrowRightIcon className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </>
  )
}

/** @deprecated use FlatCollectionGrid */
export { FlatCollectionGrid as PublicCollectionGrid }
