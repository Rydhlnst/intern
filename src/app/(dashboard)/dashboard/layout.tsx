import type React from "react"

import { requireAuth } from "@/auth/guards"
import { AppSidebar } from "@/components/app-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--library-shell)]">
      <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
