import { CalendarDaysIcon } from "lucide-react"

import { requireAuth } from "@/auth/guards"
import { Badge } from "@/components/ui/badge"
import { MobileNavTrigger } from "@/components/app-sidebar"

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
}

type SiteHeaderProps = {
  title: string
  subtitle: string
}

export async function SiteHeader({ title, subtitle }: SiteHeaderProps) {
  const user = await requireAuth()

  return (
    <header className="sticky top-0 z-10 shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center gap-4">
      <MobileNavTrigger
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        <p className="hidden truncate text-xs text-gray-500 md:block">
          {subtitle}
        </p>
      </div>

      <Badge
        variant="outline"
        className="hidden rounded-full border-gray-200 bg-gray-50 px-3 py-1 text-gray-500 sm:inline-flex"
      >
        <CalendarDaysIcon className="size-3.5" />
        {formatToday()}
      </Badge>
      <span className="text-sm font-bold tracking-tight text-foreground">Intern Library</span>
    </header>
  )
}
