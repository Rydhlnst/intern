import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { bookReviews, users } from "@/db/schema";
import type { TiptapDoc } from "@/lib/tiptap/types";
import type { ReviewListItem } from "@/components/editor/review-list";

export async function listReviewsForBook(
  bookId: number,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<ReviewListItem[]> {
  const rows = await db
    .select({
      id: bookReviews.id,
      rating: bookReviews.rating,
      contentJson: bookReviews.contentJson,
      createdAt: bookReviews.createdAt,
      updatedAt: bookReviews.updatedAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
    })
    .from(bookReviews)
    .innerJoin(users, eq(users.id, bookReviews.userId))
    .where(eq(bookReviews.bookId, bookId))
    .orderBy(desc(bookReviews.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    contentJson: r.contentJson as TiptapDoc,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: { id: r.userId, name: r.userName, image: r.userImage },
  }));
}

export async function getUserReviewForBook(userId: string, bookId: number) {
  const [row] = await db
    .select()
    .from(bookReviews)
    .where(
      and(eq(bookReviews.userId, userId), eq(bookReviews.bookId, bookId))
    )
    .limit(1);
  return row ?? null;
}

export async function getBookRatingAggregate(bookId: number) {
  const [row] = await db
    .select({
      avg: sql<number>`coalesce(avg(${bookReviews.rating}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(bookReviews)
    .where(eq(bookReviews.bookId, bookId));
  return { avg: Number(row?.avg ?? 0), count: Number(row?.count ?? 0) };
}
