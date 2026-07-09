"use server";

import { requirePermission } from "@/auth/guards";
import { db } from "@/db";
import { bookCopies, books } from "@/db/schema";
import { bookCopySchema } from "@/lib/validations/user";
import {
  parseInput,
  actionError,
  actionOk,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

type Input = FormData | Record<string, unknown>;

export async function createCopy(
  bookId: number,
  input: Input
): Promise<ActionResult> {
  await requirePermission("manage:book_copies");
  const parsed = parseInput(bookCopySchema, input);
  if (!parsed.success) return parsed.result;

  const [book] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);
  if (!book) return actionError("Book not found.");

  const d = parsed.data;
  try {
    await db.insert(bookCopies).values({
      bookId,
      copyCode: d.copyCode,
      status: d.status,
      condition: d.condition,
      shelfLocation: d.shelfLocation || null,
      notes: d.notes || null,
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A copy with this code already exists.");
    throw err;
  }

  revalidatePath(`/books/${bookId}/copies`);
  revalidatePath(`/books/${bookId}`);
  return actionOk();
}

export async function updateCopy(
  id: number,
  input: Input
): Promise<ActionResult> {
  await requirePermission("manage:book_copies");
  const parsed = parseInput(bookCopySchema, input);
  if (!parsed.success) return parsed.result;

  const [existing] = await db
    .select({ bookId: bookCopies.bookId })
    .from(bookCopies)
    .where(eq(bookCopies.id, id))
    .limit(1);
  if (!existing) return actionError("Copy not found.");

  const d = parsed.data;
  try {
    await db
      .update(bookCopies)
      .set({
        copyCode: d.copyCode,
        status: d.status,
        condition: d.condition,
        shelfLocation: d.shelfLocation || null,
        notes: d.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(bookCopies.id, id));
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A copy with this code already exists.");
    throw err;
  }

  revalidatePath(`/books/${existing.bookId}/copies`);
  revalidatePath(`/books/${existing.bookId}`);
  return actionOk();
}

export async function deleteCopy(id: number): Promise<ActionResult> {
  await requirePermission("manage:book_copies");

  const [existing] = await db
    .select({ bookId: bookCopies.bookId, status: bookCopies.status })
    .from(bookCopies)
    .where(eq(bookCopies.id, id))
    .limit(1);
  if (!existing) return actionError("Copy not found.");

  if (existing.status === "borrowed") {
    return actionError("Cannot delete a copy that is currently borrowed.");
  }

  await db.delete(bookCopies).where(eq(bookCopies.id, id));
  revalidatePath(`/books/${existing.bookId}/copies`);
  revalidatePath(`/books/${existing.bookId}`);
  return actionOk();
}
