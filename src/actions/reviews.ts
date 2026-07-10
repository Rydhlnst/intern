"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { bookReviews } from "@/db/schema";
import { requireAuth } from "@/auth/guards";
import { reviewSchema, type ReviewFormData } from "@/lib/validations/review";
import { REVIEW_MAX_CHARS } from "@/lib/validations/review";
import { extractText } from "@/lib/tiptap/extract-text";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertReview(input: ReviewFormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data review tidak valid." };

  const { bookId, rating, contentJson } = parsed.data;

  const plain = extractText(contentJson, REVIEW_MAX_CHARS + 100);
  if (plain.length === 0) {
    return { ok: false, error: "Review tidak boleh kosong." };
  }
  if (plain.length > REVIEW_MAX_CHARS) {
    return { ok: false, error: `Review melebihi ${REVIEW_MAX_CHARS} karakter.` };
  }

  await db
    .insert(bookReviews)
    .values({
      bookId,
      userId: user.id,
      rating,
      contentJson,
    })
    .onConflictDoUpdate({
      target: [bookReviews.userId, bookReviews.bookId],
      set: {
        rating,
        contentJson,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

export async function deleteReview(
  reviewId: number,
  bookId: number
): Promise<ActionResult> {
  const user = await requireAuth();

  const [existing] = await db
    .select({ userId: bookReviews.userId })
    .from(bookReviews)
    .where(eq(bookReviews.id, reviewId))
    .limit(1);

  if (!existing) return { ok: false, error: "Review tidak ditemukan." };
  if (existing.userId !== user.id) {
    return { ok: false, error: "Kamu tidak boleh menghapus review ini." };
  }

  await db
    .delete(bookReviews)
    .where(
      and(eq(bookReviews.id, reviewId), eq(bookReviews.userId, user.id))
    );

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}
