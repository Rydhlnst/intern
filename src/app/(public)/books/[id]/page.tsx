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
import { extractText } from "@/lib/tiptap/extract-text"
import type { TiptapDoc } from "@/lib/tiptap/types"

type BookDetailPageProps = {
  params: Promise<{ id: string }>
}

async function getBookFromParams(params: Promise<{ id: string }>) {
  const { id: idParam } = await params
  const id = Number(idParam)

  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  const book = await getBookById(id)

  if (!book) {
    return null
  }

  return { id, book }
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const result = await getBookFromParams(params)

  if (!result) {
    return {
      title: "Book Not Found | The Books",
      description: "The requested book detail page could not be found.",
    }
  }

  const description =
    extractText(result.book.description as TiptapDoc | null, 160) ||
    `${result.book.title} by ${result.book.author} in ${result.book.categoryName}.`

  return {
    title: `${result.book.title} | The Books`,
    description,
    openGraph: {
      title: `${result.book.title} | The Books`,
      description,
      type: "article",
    },
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const result = await getBookFromParams(params)

  if (!result) {
    notFound()
  }

  const { id, book } = result
  const session = await getSession()
  const userId = session?.user?.id ?? null

  const [rating, reviews, existingReview] = await Promise.all([
    getBookRatingAggregate(id),
    listReviewsForBook(id, { limit: 20 }),
    userId ? getUserReviewForBook(userId, id) : Promise.resolve(null),
  ])

  const publicationYear = new Date(book.publicationDate)
    .getFullYear()
    .toString()

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="flex flex-col gap-6 sm:flex-row">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-56 w-40 rounded-md object-cover shadow"
          />
        ) : (
          <div className="flex h-56 w-40 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
            No cover
          </div>
        )}
        <div className="flex-1 space-y-3">
          <div>
            <Badge variant="secondary" className="mb-2">
              {book.categoryName}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {book.title}
            </h1>
            <p className="text-muted-foreground">oleh {book.author}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Penerbit</dt>
              <dd>{book.publisher}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Terbit</dt>
              <dd>{publicationYear}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Halaman</dt>
              <dd>{book.numberOfPages}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tersedia</dt>
              <dd>
                {book.availableCopies} / {book.totalCopies} kopi
              </dd>
            </div>
            {book.isbn ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">ISBN</dt>
                <dd className="font-mono text-xs">{book.isbn}</dd>
              </div>
            ) : null}
          </dl>
          <div className="flex items-center gap-2 pt-1">
            <RatingStars value={Math.round(rating.avg)} readOnly size="sm" />
            <span className="text-sm text-muted-foreground">
              {rating.count > 0
                ? `${rating.avg.toFixed(1)} · ${rating.count} review`
                : "Belum ada review"}
            </span>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Tentang buku ini</h2>
        <RichView
          doc={book.description as TiptapDoc | null}
          emptyFallback={
            <p className="text-sm text-muted-foreground">
              Belum ada deskripsi untuk buku ini.
            </p>
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Rating &amp; Ulasan</h2>
        </div>

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
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Login untuk menulis review buku ini.
          </p>
        )}

        <ReviewList items={reviews} currentUserId={userId} />
      </section>
    </main>
  )
}
