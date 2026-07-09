"use server";

import { requirePermission } from "@/auth/guards";
import { db } from "@/db";
import { books, bookCopies } from "@/db/schema";
import { bookSchema } from "@/lib/validations/book";
import {
  parseInput,
  actionError,
  actionOk,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { uploadBookCover, deleteBookCover } from "@/lib/storage/upload-cover";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";

function extractCover(formData: FormData): File | null {
  const file = formData.get("cover");
  return file instanceof File && file.size > 0 ? file : null;
}

export async function createBook(formData: FormData): Promise<ActionResult<number>> {
  await requirePermission("create:books");
  const parsed = parseInput(bookSchema, formData);
  if (!parsed.success) return parsed.result;

  let cover: Awaited<ReturnType<typeof uploadBookCover>> | null = null;
  const file = extractCover(formData);
  if (file) {
    await requirePermission("upload:book_cover");
    try {
      cover = await uploadBookCover(file);
    } catch (err) {
      return actionError(err instanceof Error ? err.message : "Cover upload failed.");
    }
  }

  const d = parsed.data;
  try {
    const [row] = await db
      .insert(books)
      .values({
        categoryId: d.categoryId,
        title: d.title,
        author: d.author,
        isbn: d.isbn || null,
        publicationDate: d.publicationDate,
        publisher: d.publisher,
        numberOfPages: d.numberOfPages,
        description: d.description || null,
        coverUrl: cover?.coverUrl ?? null,
        coverObjectKey: cover?.coverObjectKey ?? null,
        coverMimeType: cover?.coverMimeType ?? null,
        coverSize: cover?.coverSize ?? null,
      })
      .returning({ id: books.id });

    revalidatePath("/books");
    return actionOk(row.id);
  } catch (err) {
    // Roll back the just-uploaded object so we don't orphan storage.
    if (cover) await deleteBookCover(cover.coverObjectKey).catch(() => {});
    if (isUniqueViolation(err)) return actionError("A book with this ISBN already exists.");
    throw err;
  }
}

export async function updateBook(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  await requirePermission("update:books");
  const parsed = parseInput(bookSchema, formData);
  if (!parsed.success) return parsed.result;

  const [existing] = await db
    .select({ coverObjectKey: books.coverObjectKey })
    .from(books)
    .where(eq(books.id, id))
    .limit(1);
  if (!existing) return actionError("Book not found.");

  const removeCover = formData.get("removeCover") === "true";
  const file = extractCover(formData);
  let cover: Awaited<ReturnType<typeof uploadBookCover>> | null = null;

  if (file) {
    await requirePermission("upload:book_cover");
    try {
      cover = await uploadBookCover(file);
    } catch (err) {
      return actionError(err instanceof Error ? err.message : "Cover upload failed.");
    }
  }

  const d = parsed.data;
  const coverFields =
    cover !== null
      ? {
          coverUrl: cover.coverUrl,
          coverObjectKey: cover.coverObjectKey,
          coverMimeType: cover.coverMimeType,
          coverSize: cover.coverSize,
        }
      : removeCover
        ? {
            coverUrl: null,
            coverObjectKey: null,
            coverMimeType: null,
            coverSize: null,
          }
        : {};

  await db
    .update(books)
    .set({
      categoryId: d.categoryId,
      title: d.title,
      author: d.author,
      isbn: d.isbn || null,
      publicationDate: d.publicationDate,
      publisher: d.publisher,
      numberOfPages: d.numberOfPages,
      description: d.description || null,
      ...coverFields,
      updatedAt: new Date(),
    })
    .where(eq(books.id, id));

  // Delete the previous object only after the DB row points elsewhere.
  if ((cover || removeCover) && existing.coverObjectKey) {
    await deleteBookCover(existing.coverObjectKey).catch(() => {});
  }

  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return actionOk();
}

export async function deleteBook(id: number): Promise<ActionResult> {
  await requirePermission("delete:books");

  const [{ c: copyCount }] = await db
    .select({ c: count() })
    .from(bookCopies)
    .where(eq(bookCopies.bookId, id));
  if (copyCount > 0) {
    return actionError(
      "Cannot delete a book that still has copies. Delete its copies first."
    );
  }

  const [existing] = await db
    .select({ coverObjectKey: books.coverObjectKey })
    .from(books)
    .where(eq(books.id, id))
    .limit(1);
  if (!existing) return actionError("Book not found.");

  await db.delete(books).where(eq(books.id, id));
  if (existing.coverObjectKey) {
    await deleteBookCover(existing.coverObjectKey).catch(() => {});
  }

  revalidatePath("/books");
  return actionOk();
}
