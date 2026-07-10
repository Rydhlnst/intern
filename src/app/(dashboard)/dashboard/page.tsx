import { DashboardOverview } from "@/components/dashboard-overview"
import { SiteHeader } from "@/components/site-header"
import { requirePermission } from "@/auth/guards"
import { getDashboardSummary } from "@/db/queries/dashboard"

export default async function DashboardPage() {
  await requirePermission("view:dashboard")
  const summary = await getDashboardSummary()

  return (
    <>
      <SiteHeader
        title="Library Overview"
        subtitle="Track catalog health, lending activity, and overdue follow-up from one dashboard."
      />
      <DashboardOverview summary={summary} />
    </>
  )
}
