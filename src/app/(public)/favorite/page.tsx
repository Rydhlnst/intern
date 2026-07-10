import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, Heart } from "lucide-react"

import { requireAuth } from "@/auth/guards"
import { getFavorites } from "@/db/queries/reader-collections"
import { PublicLibraryShell } from "@/components/public/public-library-shell"
import { BackButton } from "@/components/public/back-button"
import { FlatCollectionGrid } from "@/components/public/collection-grid"

export const metadata: Metadata = { title: "Favorites" }

type PageProps = { searchParams: Promise<{ page?: string }> }

export default async function FavoritePage({ searchParams }: PageProps) {
  const user = await requireAuth()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const data = await getFavorites(user.id, page)
  const shellUser = { name: user.name, email: user.email, role: user.role }

  return (
    <PublicLibraryShell activeNav="favorite" user={shellUser}>
      {/* Header */}
      <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
        <BackButton label="My Library" className="mb-4" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="size-4 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--library-accent)]">
                Loved books
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
          </div>
          <span className="text-sm text-gray-400 mb-0.5">
            {data.total} {data.total === 1 ? "book" : "books"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 py-8">
        {data.total === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-3">
            <Heart className="size-12 text-gray-200" strokeWidth={1.5} />
            <p className="text-base font-semibold text-gray-400">Belum ada favorit</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Tandai buku yang kamu sukai dan akan muncul di sini.
            </p>
            <Link
              href="/discover"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--library-accent)] hover:underline"
            >
              Jelajahi katalog
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        ) : (
          <FlatCollectionGrid
            books={data.rows}
            currentPage={data.page}
            totalPages={data.totalPages}
            baseHref="/favorite"
          />
        )}
      </div>
    </PublicLibraryShell>
  )
}
