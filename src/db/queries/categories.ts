import { db } from "@/db"
import { bookCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { fromBookCategoriesQuery } from "@/db/queries/helpers/book-categories"

export async function getCategories() {
  return fromBookCategoriesQuery()
    .groupBy(bookCategories.id)
    .orderBy(bookCategories.name)
}

export async function getCategoryById(id: number) {
  const [category] = await db
    .select()
    .from(bookCategories)
    .where(eq(bookCategories.id, id))
    .limit(1)

  return category ?? null
}
