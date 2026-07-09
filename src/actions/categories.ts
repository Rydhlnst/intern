"use server";

import { requirePermission } from "@/auth/guards";
import { db } from "@/db";
import { bookCategories, books } from "@/db/schema";
import { categorySchema } from "@/lib/validations/category";
import {
  parseInput,
  actionError,
  actionOk,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";

type Input = FormData | Record<string, unknown>;

export async function createCategory(input: Input): Promise<ActionResult> {
  await requirePermission("manage:categories");
  const parsed = parseInput(categorySchema, input);
  if (!parsed.success) return parsed.result;

  try {
    await db.insert(bookCategories).values({
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A category with this name already exists.");
    throw err;
  }

  revalidatePath("/categories");
  return actionOk();
}

export async function updateCategory(
  id: number,
  input: Input
): Promise<ActionResult> {
  await requirePermission("manage:categories");
  const parsed = parseInput(categorySchema, input);
  if (!parsed.success) return parsed.result;

  try {
    await db
      .update(bookCategories)
      .set({
        name: parsed.data.name,
        description: parsed.data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(bookCategories.id, id));
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A category with this name already exists.");
    throw err;
  }

  revalidatePath("/categories");
  return actionOk();
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requirePermission("manage:categories");

  const [{ c: bookCount }] = await db
    .select({ c: count() })
    .from(books)
    .where(eq(books.categoryId, id));

  if (bookCount > 0) {
    return actionError(
      "Cannot delete a category that still has books. Reassign or delete its books first."
    );
  }

  await db.delete(bookCategories).where(eq(bookCategories.id, id));
  revalidatePath("/categories");
  return actionOk();
}
