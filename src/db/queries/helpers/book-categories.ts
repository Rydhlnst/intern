import { count, eq } from "drizzle-orm"

import { db } from "@/db"
import { bookCategories, books } from "@/db/schema"

export function getCategoryListSelect() {
  return {
    id: bookCategories.id,
    name: bookCategories.name,
    description: bookCategories.description,
    createdAt: bookCategories.createdAt,
    bookCount: count(books.id),
  }
}

export function fromBookCategoriesQuery() {
  return db
    .select(getCategoryListSelect())
    .from(bookCategories)
    .leftJoin(books, eq(books.categoryId, bookCategories.id))
}
