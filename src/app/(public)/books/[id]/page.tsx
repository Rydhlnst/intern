import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Star } from "lucide-react"

import { getSession } from "@/auth/guards"
import { RichView } from "@/components/editor/rich-view"
import { RatingStars } from "@/components/editor/rating-stars"
import { ReviewForm } from "@/components/editor/review-form"
import { ReviewList } from "@/components/editor/review-list"
import { Badge } from "@/components/ui/badge"
import { getBookById } from "@/db/queries/books"
import {
  getBookRatingAggregate,
  getUserReviewForBook,
  listReviewsForBook,
} from "@/db/queries/reviews"
import { isBookmarked, isFavorited } from "@/db/queries/reader-collections"
import { PublicLibraryShell } from "@/components/public/public-library-shell"
import { BookActionButtons } from "@/components/public/book-action-buttons"
import { BackButton } from "@/components/public/back-button"
import { extractText } from "@/lib/tiptap/extract-text"
import type { TiptapDoc } from "@/lib/tiptap/types"

type BookDetailPageProps = {
  params: Promise<{ id: string }>
}

async function getBookFromParams(params: Promise<{ id: string }>) {
  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id) || id <= 0) return null
  const book = await getBookById(id)
  if (!book) return null
  return { id, book }
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const result = await getBookFromParams(params)
  if (!result) return { title: "Book Not Found | The Books" }

  const description =
    extractText(result.book.description as TiptapDoc | null, 160) ||
    `${result.book.title} by ${result.book.author} in ${result.book.categoryName}.`

  return {
    title: `${result.book.title} | The Books`,
    description,
    openGraph: { title: `${result.book.title} | The Books`, description, type: "article" },
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const result = await getBookFromParams(params)
  if (!result) notFound()

  const { id, book } = result
  const session = await getSession()
  const userId = session?.user?.id ?? null

  const [rating, reviews, existingReview, bookmarked, favorited] = await Promise.all([
    getBookRatingAggregate(id),
    listReviewsForBook(id, { limit: 20 }),
    userId ? getUserReviewForBook(userId, id) : Promise.resolve(null),
    userId ? isBookmarked(userId, id) : Promise.resolve(false),
    userId ? isFavorited(userId, id) : Promise.resolve(false),
  ])

  const publicationYear = new Date(book.publicationDate).getFullYear().toString()

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role ?? "reader",
      }
    : null

  return (
    <PublicLibraryShell activeNav="discover" user={user}>
      {/* ── Back nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 sm:px-8 py-4 border-b border-gray-100">
        <BackButton label="Discover" />
      </div>

      {/* ── Book header ──────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-8 flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Cover */}
        <div className="shrink-0">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-64 w-44 rounded-2xl object-cover shadow-xl ring-1 ring-black/5"
            />
          ) : (
            <div className="flex h-64 w-44 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
              No cover
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2 rounded-full">
              {book.categoryName}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">{book.title}</h1>
            <p className="mt-1 text-base text-gray-500">oleh {book.author}</p>
          </div>

          <div className="flex items-center gap-2">
            <RatingStars value={Math.round(rating.avg)} readOnly size="sm" />
            <span className="text-sm text-gray-400">
              {rating.count > 0
                ? `${rating.avg.toFixed(1)} · ${rating.count} review`
                : "Belum ada review"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Penerbit</dt>
              <dd className="mt-0.5 text-gray-800">{book.publisher}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Terbit</dt>
              <dd className="mt-0.5 text-gray-800">{publicationYear}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Halaman</dt>
              <dd className="mt-0.5 text-gray-800">{book.numberOfPages}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tersedia</dt>
              <dd className="mt-0.5 text-gray-800">
                {book.availableCopies} / {book.totalCopies} kopi
              </dd>
            </div>
            {book.isbn && (
              <div className="col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">ISBN</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-800">{book.isbn}</dd>
              </div>
            )}
          </dl>

          {userId && (
            <BookActionButtons
              bookId={id}
              initialBookmarked={bookmarked}
              initialFavorited={favorited}
            />
          )}
          {!userId && (
            <p className="text-xs text-gray-400">
              <a href="/login" className="text-[var(--library-accent)] hover:underline">Login</a>{" "}
              untuk menyimpan atau memfavoritkan buku ini.
            </p>
          )}
        </div>
      </div>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />
      <div className="px-6 sm:px-8 py-8">
        <h2 className="text-lg font-bold tracking-tight mb-4">Tentang buku ini</h2>
        <div className="max-w-2xl">
          <RichView
            doc={book.description as TiptapDoc | null}
            emptyFallback={
              <p className="text-sm text-gray-400">Belum ada deskripsi untuk buku ini.</p>
            }
          />
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />
      <div className="px-6 sm:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Star className="size-5 text-amber-400 fill-amber-400" />
          <h2 className="text-lg font-bold tracking-tight">Rating &amp; Ulasan</h2>
        </div>

        <div className="max-w-2xl space-y-6">
          {userId ? (
            <ReviewForm
              bookId={id}
              existing={
                existingReview
                  ? {
                      id: existingReview.id,
                      rating: existingReview.rating,
                      contentJson: existingReview.contentJson as TiptapDoc,
                    }
                  : null
              }
            />
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
              <a href="/login" className="text-[var(--library-accent)] hover:underline">Login</a>{" "}
              untuk menulis review buku ini.
            </p>
          )}

          <ReviewList items={reviews} currentUserId={userId} />
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-12" />
    </PublicLibraryShell>
  )
}
