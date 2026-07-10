"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAuth } from "@/auth/guards"
import { db } from "@/db"
import { readerBookmarks, readerFavorites, readerHistory } from "@/db/schema"
import { actionOk } from "@/lib/action-result"
import type { ActionResult } from "@/lib/action-result"

export async function toggleBookmark(bookId: number): Promise<ActionResult<{ bookmarked: boolean }>> {
  const user = await requireAuth()

  const existing = await db
    .select({ id: readerBookmarks.id })
    .from(readerBookmarks)
    .where(and(eq(readerBookmarks.userId, user.id), eq(readerBookmarks.bookId, bookId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(readerBookmarks).where(eq(readerBookmarks.id, existing[0].id))
    revalidatePath(`/books/${bookId}`)
    revalidatePath("/bookmark")
    revalidatePath("/library")
    return actionOk({ bookmarked: false })
  }

  await db.insert(readerBookmarks).values({ userId: user.id, bookId })
  await db.insert(readerHistory).values({ userId: user.id, bookId, action: "bookmarked" })
  revalidatePath(`/books/${bookId}`)
  revalidatePath("/bookmark")
  revalidatePath("/library")
  revalidatePath("/history")
  return actionOk({ bookmarked: true })
}

export async function toggleFavorite(bookId: number): Promise<ActionResult<{ favorited: boolean }>> {
  const user = await requireAuth()

  const existing = await db
    .select({ id: readerFavorites.id })
    .from(readerFavorites)
    .where(and(eq(readerFavorites.userId, user.id), eq(readerFavorites.bookId, bookId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(readerFavorites).where(eq(readerFavorites.id, existing[0].id))
    revalidatePath(`/books/${bookId}`)
    revalidatePath("/favorite")
    revalidatePath("/library")
    return actionOk({ favorited: false })
  }

  await db.insert(readerFavorites).values({ userId: user.id, bookId })
  await db.insert(readerHistory).values({ userId: user.id, bookId, action: "favorited" })
  revalidatePath(`/books/${bookId}`)
  revalidatePath("/favorite")
  revalidatePath("/library")
  revalidatePath("/history")
  return actionOk({ favorited: true })
}
