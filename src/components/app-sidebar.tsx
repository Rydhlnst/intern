"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpenTextIcon,
  ChevronRightIcon,
  FolderKanbanIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  LogOutIcon,
  MenuIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type DashboardUser = {
  name: string
  email: string
  role: string
}

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  implemented: boolean
}

const navSections: Array<{ label: string; items: readonly NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon, implemented: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Books", href: "/dashboard/books", icon: BookOpenTextIcon, implemented: true },
      { title: "Categories", href: "/dashboard/categories", icon: FolderKanbanIcon, implemented: true },
    ],
  },
  {
    label: "Circulation",
    items: [
      { title: "Members", href: "#", icon: UsersIcon, implemented: false },
      { title: "Loans", href: "#", icon: LibraryBigIcon, implemented: false },
    ],
  },
]

const navSupport: readonly NavItem[] = [
  { title: "Settings", href: "#", icon: Settings2Icon, implemented: false },
  { title: "Help", href: "#", icon: HelpCircleIcon, implemented: false },
]

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem
  isActive: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const baseClass = cn(
    "group relative flex items-center gap-3 rounded-lg pl-4 pr-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-[var(--library-highlight-soft)] font-semibold text-foreground"
      : "text-[var(--library-ink-soft)] hover:bg-gray-50 hover:text-foreground"
  )

  const activeBar = isActive && (
    <span
      aria-hidden
      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--library-accent)]"
    />
  )

  if (!item.implemented) {
    return (
      <div className={cn(baseClass, "cursor-not-allowed opacity-70")}>
        {activeBar}
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{item.title}</span>
        <Badge
          variant="outline"
          className="rounded-full border-gray-200 bg-white text-[10px] font-normal text-gray-400"
        >
          Soon
        </Badge>
      </div>
    )
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={baseClass}>
      {activeBar}
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{item.title}</span>
      {isActive && (
        <ChevronRightIcon className="size-3.5 text-[var(--library-accent)]" />
      )}
    </Link>
  )
}

function SidebarBody({
  user,
  onNavigate,
}: {
  user: DashboardUser
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" onClick={onNavigate} className="block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--library-ink-soft)]">
            Admin
          </p>
          <p className="text-sm font-bold tracking-tight text-foreground">
            Intern Library
          </p>
        </Link>
      </div>

      {/* Sectioned nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.title}
                  item={item}
                  isActive={item.implemented && isActive(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Support + logout */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
        <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Support
        </p>
        {navSupport.map((item) => (
          <NavLink
            key={item.title}
            item={item}
            isActive={false}
            onNavigate={onNavigate}
          />
        ))}
        <button
          type="button"
          onClick={async () => {
            onNavigate?.()
            await authClient.signOut()
            router.push("/login")
          }}
          className="mt-1 w-full flex items-center gap-3 rounded-lg pl-4 pr-3 py-2 text-sm text-[var(--library-ink-soft)] hover:bg-gray-50 hover:text-foreground transition-colors"
        >
          <LogOutIcon className="size-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>

      {/* User card */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="size-9 shrink-0 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider text-gray-400">
              {user.role.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export function AppSidebar({ user }: { user: DashboardUser }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white">
      <SidebarBody user={user} />
    </aside>
  )
}

export function MobileNavTrigger({ user }: { user: DashboardUser }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden -ml-1 h-9 w-9 rounded-full"
          aria-label="Open menu"
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-white flex flex-col"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Dashboard navigation menu
        </SheetDescription>
        <SidebarBody user={user} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
