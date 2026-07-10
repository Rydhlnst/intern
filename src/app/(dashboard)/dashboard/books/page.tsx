import { SiteHeader } from "@/components/site-header"
import { requirePermission } from "@/auth/guards"
import { hasPermission } from "@/auth/permissions"
import { getBooks } from "@/db/queries/books"
import { getCategories } from "@/db/queries/categories"
import { BooksShell } from "@/components/books-shell"

export const metadata = { title: "Books" }

type BooksPageProps = {
  searchParams: Promise<{
    q?: string
    category?: string
    from?: string
    to?: string
    page?: string
  }>
}

export default async function DashboardBooksPage({ searchParams }: BooksPageProps) {
  const sp = await searchParams

  const user = await requirePermission("view:books")
  const canManage = hasPermission(user.role, "create:books")

  const filters = {
    search: sp.q || undefined,
    categoryId: sp.category ? Number(sp.category) : undefined,
    startDate: sp.from || undefined,
    endDate: sp.to || undefined,
    page: sp.page || undefined,
  }

  const [books, categories] = await Promise.all([getBooks(filters), getCategories()])

  return (
    <>
      <SiteHeader
        title="Book Catalog"
        subtitle="Browse, filter, and manage books in the library collection."
      />
      <BooksShell
        books={books as never}
        categories={categories}
        filters={filters}
        canManage={canManage}
      />
    </>
  )
}
