import type { Metadata } from "next"

import { fromSearchParam } from "@/lib/discover-data"
import { getPublicDiscoverPageData } from "@/db/queries/public-discover"
import { getSession } from "@/auth/guards"
import { PublicLibraryShell } from "@/components/public/public-library-shell"

type CategoryPageProps = {
  searchParams: Promise<{
    category?: string | string[]
    q?: string | string[]
  }>
}

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80)
}

export const metadata: Metadata = {
  title: "Browse Categories | The Books",
  description: "Public category page with cached category counts and filtered book previews.",
  alternates: {
    canonical: "/discover/categories",
  },
}

export default async function DiscoverCategoriesPage({ searchParams }: CategoryPageProps) {
  const resolvedSearchParams = await searchParams
  const query = normalizeQuery(fromSearchParam(resolvedSearchParams.q))
  const requestedCategorySlug = fromSearchParam(resolvedSearchParams.category) || "all"
  const [data, session] = await Promise.all([
    getPublicDiscoverPageData({ query, categorySlug: requestedCategorySlug }),
    getSession(),
  ])
  const user = session?.user
    ? { name: session.user.name, email: session.user.email, role: (session.user as { role?: string }).role ?? "reader" }
    : null

  return (
    <PublicLibraryShell
      activeNav="category"
      title="Browse Categories"
      description="Filter the library collection by category and browse matching books."
      books={data.books}
      categories={data.categories}
      query={data.query}
      selectedCategorySlug={data.selectedCategorySlug}
      selectedCategoryLabel={data.selectedCategoryLabel}
      variant="categories"
      user={user}
    />
  )
}
