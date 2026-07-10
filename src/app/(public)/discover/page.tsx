import type { Metadata } from "next"

import { fromSearchParam } from "@/lib/discover-data"
import { getPublicDiscoverPageData } from "@/db/queries/public-discover"
import { getSession } from "@/auth/guards"
import { PublicLibraryShell } from "@/components/public/public-library-shell"

type DiscoverPageProps = {
  searchParams: Promise<{
    category?: string | string[]
    q?: string | string[]
  }>
}

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80)
}

export async function generateMetadata({ searchParams }: DiscoverPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const query = normalizeQuery(fromSearchParam(resolvedSearchParams.q))

  return {
    title: query ? `Search "${query}" | The Books` : "Discover Books | The Books",
    description: "Discover books, browse categories, and open detailed book pages across The Books public library.",
    alternates: {
      canonical: "/discover",
    },
  }
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
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
      activeNav="discover"
      title="Discover Books"
      description="Fresh catalog picks matched to the same calm, editorial layout."
      books={data.books}
      categories={data.categories}
      query={data.query}
      selectedCategorySlug={data.selectedCategorySlug}
      selectedCategoryLabel={data.selectedCategoryLabel}
      user={user}
    />
  )
}
