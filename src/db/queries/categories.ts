import { db } from "@/db";
import { bookCategories, books } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function getCategories() {
  return db
    .select({
      id: bookCategories.id,
      name: bookCategories.name,
      description: bookCategories.description,
      createdAt: bookCategories.createdAt,
      bookCount: count(books.id),
    })
    .from(bookCategories)
    .leftJoin(books, eq(books.categoryId, bookCategories.id))
    .groupBy(bookCategories.id)
    .orderBy(bookCategories.name);
}

export async function getCategoryById(id: number) {
  const [category] = await db
    .select()
    .from(bookCategories)
    .where(eq(bookCategories.id, id))
    .limit(1);
  return category ?? null;
}
