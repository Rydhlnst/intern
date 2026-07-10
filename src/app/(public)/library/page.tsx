import type { Metadata } from "next"
import Link from "next/link"
import { Bookmark, Heart, History, ArrowRight, BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react"

import { requireAuth } from "@/auth/guards"
import {
  getBookmarks,
  getFavorites,
  getUserBorrowHistory,
  type BorrowRecord,
} from "@/db/queries/reader-collections"
import { PublicLibraryShell } from "@/components/public/public-library-shell"
import { FlatCollectionGrid } from "@/components/public/collection-grid"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "My Library" }

function loanStatusBadge(status: BorrowRecord["status"], dueDate: string) {
  const isOverdue = status === "overdue" || (status === "borrowed" && new Date(dueDate) < new Date())
  if (status === "returned") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
        <CheckCircle className="size-3" /> Dikembalikan
      </span>
    )
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500">
        <AlertCircle className="size-3" /> Terlambat
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
      <Clock className="size-3" /> Dipinjam
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export default async function LibraryPage() {
  const user = await requireAuth()

  const [bookmarks, favorites, loans] = await Promise.all([
    getBookmarks(user.id, 1),
    getFavorites(user.id, 1),
    getUserBorrowHistory(user.id),
  ])

  const shellUser = { name: user.name, email: user.email, role: user.role }

  return (
    <PublicLibraryShell activeNav="library" user={shellUser}>
      {/* ── Profile header ───────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--library-accent)] mb-1">
          Personal shelf
        </p>
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selamat datang kembali, {user.name.split(" ")[0]}
        </p>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />
      <div className="px-6 sm:px-8 py-6 grid grid-cols-3 gap-4 sm:gap-8">
        <Link href="/bookmark" className="group">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="size-4 text-[var(--library-accent)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[var(--library-accent)] transition-colors">
              Bookmark
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{bookmarks.total}</p>
          <p className="mt-1 text-xs text-gray-400 group-hover:text-[var(--library-accent)] transition-colors flex items-center gap-0.5">
            Lihat semua <ArrowRight className="size-3" />
          </p>
        </Link>

        <Link href="/favorite" className="group">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="size-4 text-red-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-red-400 transition-colors">
              Favorit
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{favorites.total}</p>
          <p className="mt-1 text-xs text-gray-400 group-hover:text-red-400 transition-colors flex items-center gap-0.5">
            Lihat semua <ArrowRight className="size-3" />
          </p>
        </Link>

        <Link href="/history" className="group">
          <div className="flex items-center gap-2 mb-1">
            <History className="size-4 text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-700 transition-colors">
              Riwayat
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loans.length}</p>
          <p className="mt-1 text-xs text-gray-400 group-hover:text-gray-700 transition-colors flex items-center gap-0.5">
            Pinjaman <ArrowRight className="size-3" />
          </p>
        </Link>
      </div>

      {/* ── Favorites preview ────────────────────────────────────────────── */}
      {favorites.total > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="px-6 sm:px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-red-400" />
                <h2 className="text-base font-bold tracking-tight">Favorit</h2>
                <span className="text-sm text-gray-400">({favorites.total})</span>
              </div>
              {favorites.total > favorites.rows.length && (
                <Link
                  href="/favorite"
                  className="text-xs font-medium text-[var(--library-accent)] hover:underline flex items-center gap-1"
                >
                  Lihat semua <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
            <FlatCollectionGrid books={favorites.rows} />
          </div>
        </>
      )}

      {/* ── Bookmarks preview ────────────────────────────────────────────── */}
      {bookmarks.total > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="px-6 sm:px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bookmark className="size-4 text-[var(--library-accent)]" />
                <h2 className="text-base font-bold tracking-tight">Bookmark</h2>
                <span className="text-sm text-gray-400">({bookmarks.total})</span>
              </div>
              {bookmarks.total > bookmarks.rows.length && (
                <Link
                  href="/bookmark"
                  className="text-xs font-medium text-[var(--library-accent)] hover:underline flex items-center gap-1"
                >
                  Lihat semua <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
            <FlatCollectionGrid books={bookmarks.rows} />
          </div>
        </>
      )}

      {/* ── Borrow history ───────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />
      <div className="px-6 sm:px-8 py-6">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="size-4 text-[var(--library-accent)]" />
          <h2 className="text-base font-bold tracking-tight">Riwayat Peminjaman</h2>
          <span className="text-sm text-gray-400">({loans.length})</span>
        </div>

        {loans.length === 0 ? (
          <p className="text-sm text-gray-400 py-6">
            Belum ada riwayat peminjaman. Kunjungi perpustakaan untuk meminjam buku.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Buku</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Kode Kopi</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Dipinjam</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Jatuh Tempo</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, idx) => (
                  <tr
                    key={loan.id}
                    className={cn("align-top", idx < loans.length - 1 && "border-b border-gray-50")}
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/books/${loan.bookId}`}
                        className="font-medium text-gray-900 hover:text-[var(--library-accent)] transition-colors line-clamp-1"
                      >
                        {loan.bookTitle}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{loan.bookAuthor}</p>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="font-mono text-xs text-gray-500">{loan.copyCode}</span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                      {formatDate(loan.borrowedAt)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                      {formatDate(loan.dueDate)}
                    </td>
                    <td className="py-3">
                      {loanStatusBadge(loan.status, loan.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="h-12" />
    </PublicLibraryShell>
  )
}
