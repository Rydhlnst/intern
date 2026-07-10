import { SiteHeader } from "@/components/site-header"
import { requirePermission } from "@/auth/guards"
import { getCategories } from "@/db/queries/categories"
import { CategoriesShell } from "@/components/categories-shell"

export const metadata = { title: "Categories" }

export default async function DashboardCategoriesPage() {
  await requirePermission("manage:categories")
  const categories = await getCategories()

  return (
    <>
      <SiteHeader
        title="Book Categories"
        subtitle="Manage the categories used to organise books in the catalog."
      />
      <CategoriesShell categories={categories} />
    </>
  )
}
