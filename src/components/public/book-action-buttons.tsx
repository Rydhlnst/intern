"use client"

import { useState, useTransition } from "react"
import { Bookmark, Heart } from "lucide-react"
import { toast } from "sonner"

import { toggleBookmark, toggleFavorite } from "@/actions/reader-collections"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BookActionButtonsProps = {
  bookId: number
  initialBookmarked: boolean
  initialFavorited: boolean
}

export function BookActionButtons({ bookId, initialBookmarked, initialFavorited }: BookActionButtonsProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [bookmarkPending, startBookmarkTransition] = useTransition()
  const [favoritePending, startFavoriteTransition] = useTransition()

  function handleBookmark() {
    const toastId = toast.loading(bookmarked ? "Menghapus bookmark..." : "Menyimpan bookmark...")
    startBookmarkTransition(async () => {
      const result = await toggleBookmark(bookId)
      if (result.ok && result.data) {
        setBookmarked(result.data.bookmarked)
        toast.success(result.data.bookmarked ? "Ditambahkan ke Bookmark" : "Dihapus dari Bookmark", { id: toastId })
      } else if (!result.ok) {
        toast.error(result.error, { id: toastId })
      }
    })
  }

  function handleFavorite() {
    const toastId = toast.loading(favorited ? "Menghapus favorit..." : "Menambahkan ke favorit...")
    startFavoriteTransition(async () => {
      const result = await toggleFavorite(bookId)
      if (result.ok && result.data) {
        setFavorited(result.data.favorited)
        toast.success(result.data.favorited ? "Ditambahkan ke Favorit" : "Dihapus dari Favorit", { id: toastId })
      } else if (!result.ok) {
        toast.error(result.error, { id: toastId })
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBookmark}
        disabled={bookmarkPending}
        className={cn(
          "rounded-full gap-2 transition-all",
          bookmarked
            ? "bg-[var(--library-accent)] text-[var(--library-accent-foreground)] border-[var(--library-accent)] hover:bg-[var(--library-accent)]/90"
            : "hover:border-[var(--library-accent)] hover:text-[var(--library-accent)]"
        )}
      >
        <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
        {bookmarked ? "Tersimpan" : "Simpan"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFavorite}
        disabled={favoritePending}
        className={cn(
          "rounded-full gap-2 transition-all",
          favorited
            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            : "hover:border-red-300 hover:text-red-500"
        )}
      >
        <Heart className={cn("size-4", favorited && "fill-current")} />
        {favorited ? "Difavoritkan" : "Favorit"}
      </Button>
    </div>
  )
}
