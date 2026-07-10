import type { Metadata } from "next"
import Link from "next/link"
import { History, Bookmark, Heart, Eye } from "lucide-react"

import { requireAuth } from "@/auth/guards"
import { getReaderHistory } from "@/db/queries/reader-collections"
import { PublicLibraryShell } from "@/components/public/public-library-shell"
import { BackButton } from "@/components/public/back-button"

export const metadata: Metadata = { title: "History" }

type PageProps = { searchParams: Promise<{ page?: string }> }

function ActionIcon({ action }: { action: string }) {
  if (action === "bookmarked") return <Bookmark className="size-3.5 text-[var(--library-accent)]" />
  if (action === "favorited") return <Heart className="size-3.5 text-red-400 fill-red-400" />
  return <Eye className="size-3.5 text-gray-400" />
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function actionLabel(action: string) {
  if (action === "bookmarked") return "Disimpan"
  if (action === "favorited") return "Difavoritkan"
  return "Dilihat"
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const data = await getReaderHistory(user.id, page)
  const shellUser = { name: user.name, email: user.email, role: user.role }

  return (
    <PublicLibraryShell activeNav="history" user={shellUser}>
      {/* Header */}
      <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
        <BackButton label="My Library" className="mb-4" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="size-4 text-[var(--library-accent)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--library-accent)]">
                Activity log
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Reading History</h1>
          </div>
          <span className="text-sm text-gray-400 mb-0.5">
            {data.total} {data.total === 1 ? "activity" : "activities"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8">
        {data.total === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-3">
            <History className="size-12 text-gray-200" strokeWidth={1.5} />
            <p className="text-base font-semibold text-gray-400">Belum ada aktivitas</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Bookmark atau favoritkan buku untuk mulai merekam aktivitasmu.
            </p>
            <Link
              href="/discover"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--library-accent)] hover:underline"
            >
              Jelajahi katalog →
            </Link>
          </div>
        ) : (
          <>
            <ol>
              {data.rows.map((item, idx) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-4 py-4 ${idx < data.rows.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 size-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <ActionIcon action={item.action} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    {item.bookId ? (
                      <Link
                        href={`/books/${item.bookId}`}
                        className="text-sm font-semibold text-gray-900 hover:text-[var(--library-accent)] transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {item.query ? `Searched "${item.query}"` : item.title}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {actionLabel(item.action)}
                      {item.author && item.author !== "Reader Session" && (
                        <> · <span>{item.author}</span></>
                      )}
                      {item.category && item.category !== "Search" && (
                        <> · <span>{item.category}</span></>
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  <time className="shrink-0 text-xs text-gray-400 tabular-nums pt-0.5">
                    {relativeTime(item.createdAt)}
                  </time>
                </li>
              ))}
            </ol>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="py-6 flex items-center justify-center gap-3 border-t border-gray-50">
                {page > 1 && (
                  <Link
                    href={`/history?page=${page - 1}`}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    ← Sebelumnya
                  </Link>
                )}
                <span className="text-sm text-gray-400">{page} / {data.totalPages}</span>
                {page < data.totalPages && (
                  <Link
                    href={`/history?page=${page + 1}`}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    Berikutnya →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-12" />
    </PublicLibraryShell>
  )
}
