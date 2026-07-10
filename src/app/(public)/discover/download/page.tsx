import type { Metadata } from "next"

import { getPublicDiscoverPageData } from "@/db/queries/public-discover"
import { getSession } from "@/auth/guards"
import { PublicLibraryShell } from "@/components/public/public-library-shell"

export const metadata: Metadata = {
  title: "Download Center | The Books",
  description: "Dedicated public download route separated from discover and category browsing.",
  alternates: {
    canonical: "/discover/download",
  },
}

export default async function DiscoverDownloadPage() {
  const [data, session] = await Promise.all([
    getPublicDiscoverPageData({}),
    getSession(),
  ])
  const user = session?.user
    ? { name: session.user.name, email: session.user.email, role: (session.user as { role?: string }).role ?? "reader" }
    : null

  return (
    <PublicLibraryShell
      activeNav="download"
      title="Download Center"
      description="A separate route for future file delivery so public catalog browsing stays lighter and easier to cache."
      books={[]}
      categories={data.categories}
      query=""
      selectedCategorySlug="all"
      selectedCategoryLabel={null}
      variant="download"
      user={user}
    />
  )
}
