import { db } from "@/db";
import { bookCopies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCopiesByBook(bookId: number) {
  return db
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.bookId, bookId))
    .orderBy(bookCopies.copyCode);
}

export async function getCopyById(id: number) {
  const [copy] = await db
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.id, id))
    .limit(1);
  return copy ?? null;
}
