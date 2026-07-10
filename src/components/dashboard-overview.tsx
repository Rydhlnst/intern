"use client"

import { useMemo, useState } from "react"
import {
  ArrowUpRightIcon,
  BookOpenTextIcon,
  CopyIcon,
  LibraryBigIcon,
  OctagonAlertIcon,
  SearchIcon,
  ShapesIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type SummaryCards = {
  totalBooks: number
  totalCopies: number
  availableCopies: number
  borrowedCopies: number
  totalCategories: number
  totalMembers: number
  activeLoans: number
  overdueLoans: number
}

type SummaryBook = {
  id: number
  title: string
  author: string
  categoryName: string
  availableCopies: number
}

type SummaryLoan = {
  id: number
  memberName: string
  bookTitle: string
  copyCode: string
  dueDate: string | Date
  status: string
  isOverdue: boolean
}

type DashboardSummary = {
  cards: SummaryCards
  latestBooks: SummaryBook[]
  latestLoans: SummaryLoan[]
  overdueLoans: SummaryLoan[]
}

type DashboardOverviewProps = {
  summary: DashboardSummary
}

const cardMeta = [
  {
    key: "totalBooks",
    label: "Books",
    description: "Distinct book records",
    icon: BookOpenTextIcon,
  },
  {
    key: "totalCopies",
    label: "Copies",
    description: "Physical copies tracked",
    icon: CopyIcon,
  },
  {
    key: "totalMembers",
    label: "Members",
    description: "Registered library members",
    icon: UsersIcon,
  },
  {
    key: "activeLoans",
    label: "Active Loans",
    description: "Borrowed or overdue items",
    icon: LibraryBigIcon,
  },
  {
    key: "overdueLoans",
    label: "Overdue",
    description: "Needs immediate follow-up",
    icon: OctagonAlertIcon,
  },
  {
    key: "totalCategories",
    label: "Categories",
    description: "Catalog classification groups",
    icon: ShapesIcon,
  },
] as const satisfies Array<{
  key: keyof SummaryCards
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}>

const bookCategories = ["All categories", "Business", "Design", "Classics", "Technology", "Science", "History", "Fiction"]
const loanScopes = [
  { value: "all", label: "All activity" },
  { value: "active", label: "Active only" },
  { value: "overdue", label: "Overdue first" },
  { value: "returned", label: "Returned only" },
] as const

export function DashboardOverview({ summary }: DashboardOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All categories")
  const [loanScope, setLoanScope] = useState<(typeof loanScopes)[number]["value"]>("all")
  const [onlyAvailableBooks, setOnlyAvailableBooks] = useState(false)

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredBooks = useMemo(() => {
    return summary.latestBooks.filter((book) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [book.title, book.author, book.categoryName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesCategory =
        selectedCategory === "All categories" || book.categoryName === selectedCategory

      const matchesAvailability = !onlyAvailableBooks || book.availableCopies > 0

      return matchesSearch && matchesCategory && matchesAvailability
    })
  }, [normalizedSearch, onlyAvailableBooks, selectedCategory, summary.latestBooks])

  const filteredLoans = useMemo(() => {
    return summary.latestLoans.filter((loan) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [loan.memberName, loan.bookTitle, loan.copyCode]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesScope =
        loanScope === "all" ||
        (loanScope === "active" && loan.status !== "returned") ||
        (loanScope === "overdue" && loan.isOverdue) ||
        (loanScope === "returned" && loan.status === "returned")

      return matchesSearch && matchesScope
    })
  }, [loanScope, normalizedSearch, summary.latestLoans])

  const filteredOverdue = useMemo(() => {
    return summary.overdueLoans.filter((loan) => {
      if (normalizedSearch.length === 0) return true

      return [loan.memberName, loan.bookTitle, loan.copyCode]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [normalizedSearch, summary.overdueLoans])

  const activeFilters = [
    selectedCategory !== "All categories" ? selectedCategory : null,
    loanScope !== "all" ? loanScopes.find((item) => item.value === loanScope)?.label : null,
    onlyAvailableBooks ? "Available only" : null,
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-1 flex-col bg-[var(--library-shell)]">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <DashboardCommandBar
          activeFilters={activeFilters}
          loanScope={loanScope}
          onCategoryChange={setSelectedCategory}
          onLoanScopeChange={setLoanScope}
          onOnlyAvailableChange={setOnlyAvailableBooks}
          onSearchChange={setSearchTerm}
          onlyAvailableBooks={onlyAvailableBooks}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        <DashboardSummaryCards summary={summary} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
          <LibraryActivityCard summary={summary} />
          <OverduePanel loans={filteredOverdue} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <RecentBooksCard books={filteredBooks} />
          <RecentLoansCard loans={filteredLoans} />
        </div>
      </div>
    </div>
  )
}

type DashboardCommandBarProps = {
  activeFilters: string[]
  loanScope: (typeof loanScopes)[number]["value"]
  onCategoryChange: (value: string) => void
  onLoanScopeChange: (value: (typeof loanScopes)[number]["value"]) => void
  onOnlyAvailableChange: (value: boolean) => void
  onSearchChange: (value: string) => void
  onlyAvailableBooks: boolean
  searchTerm: string
  selectedCategory: string
}

function DashboardCommandBar({
  activeFilters,
  loanScope,
  onCategoryChange,
  onLoanScopeChange,
  onOnlyAvailableChange,
  onSearchChange,
  onlyAvailableBooks,
  searchTerm,
  selectedCategory,
}: DashboardCommandBarProps) {
  return (
    <Card className="overflow-hidden rounded-[34px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
      <CardContent className="space-y-5 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Search and filter your library operations fast
            </h2>
          </div>

          <MegaActionsMenu />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] bg-background/85 p-3 shadow-sm ring-1 ring-black/5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--library-ink-soft)]" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search books, members, copy codes, or loan activity..."
              className="h-11 rounded-2xl bg-[var(--library-panel-strong)] pr-18 pl-10 text-sm shadow-none"
            />
            <Badge variant="outline" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full border-border bg-background/90 px-2 py-0 text-[10px] text-[var(--library-ink-soft)]">
              Ctrl K
            </Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-nowrap">
            <FilterDropdown
              loanScope={loanScope}
              onlyAvailableBooks={onlyAvailableBooks}
              onCategoryChange={onCategoryChange}
              onLoanScopeChange={onLoanScopeChange}
              onOnlyAvailableChange={onOnlyAvailableChange}
              selectedCategory={selectedCategory}
            />
            <Button className="h-11 rounded-2xl px-5">
              Apply view
            </Button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} className="rounded-full bg-[var(--library-highlight-soft)] px-3 py-1 text-[var(--library-accent)] hover:bg-[var(--library-highlight-soft)]">
                {filter}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FilterDropdown({
  loanScope,
  onlyAvailableBooks,
  onCategoryChange,
  onLoanScopeChange,
  onOnlyAvailableChange,
  selectedCategory,
}: Omit<DashboardCommandBarProps, "activeFilters" | "onSearchChange" | "searchTerm">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 rounded-2xl bg-[var(--library-panel-strong)] px-4">
          <SlidersHorizontalIcon data-icon="inline-start" className="size-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} align="end" className="w-[min(92vw,760px)] rounded-[28px] bg-[var(--library-panel)] p-4 shadow-xl ring-1 ring-black/5 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr_0.9fr]">
          <div className="space-y-3">
            <DropdownMenuLabel className="px-0 text-sm font-semibold text-foreground">Book categories</DropdownMenuLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {bookCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryChange(category)}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-left text-sm transition-colors",
                    selectedCategory === category
                      ? "border-transparent bg-[var(--library-accent)] text-[var(--library-accent-foreground)]"
                      : "border-border bg-background/80 text-[var(--library-ink-soft)] hover:bg-[var(--library-panel-strong)] hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <DropdownMenuLabel className="px-0 text-sm font-semibold text-foreground">Loan scope</DropdownMenuLabel>
            <div className="space-y-2">
              {loanScopes.map((scope) => (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => onLoanScopeChange(scope.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm transition-colors",
                    loanScope === scope.value
                      ? "border-transparent bg-[var(--library-accent)] text-[var(--library-accent-foreground)]"
                      : "border-border bg-background/80 text-[var(--library-ink-soft)] hover:bg-[var(--library-panel-strong)] hover:text-foreground"
                  )}
                >
                  {scope.label}
                  {loanScope === scope.value ? <span className="text-xs uppercase tracking-[0.16em]">On</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <DropdownMenuLabel className="px-0 text-sm font-semibold text-foreground">Quick toggles</DropdownMenuLabel>
            <div className="rounded-[24px] bg-background/80 p-3 ring-1 ring-black/5">
              <DropdownMenuCheckboxItem
                checked={onlyAvailableBooks}
                onCheckedChange={(value) => onOnlyAvailableChange(Boolean(value))}
                className="rounded-2xl px-3 py-3"
              >
                Only show books with available copies
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator className="mx-0 bg-black/5" />
              <div className="px-3 py-3 text-sm text-[var(--library-ink-soft)]">
                Smooth menu motion and compact filtering keep the dashboard aligned with the public-page experience.
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MegaActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 rounded-2xl bg-background/80 px-4">
          <SparklesIcon data-icon="inline-start" className="size-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} align="end" className="w-[min(92vw,820px)] rounded-[30px] bg-[var(--library-panel)] p-4 shadow-xl ring-1 ring-black/5 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <MegaMenuSection
            title="Circulation"
            items={[
              "Start new loan flow",
              "Review overdue borrowers",
              "Open return queue",
            ]}
          />
          <MegaMenuSection
            title="Catalog"
            items={[
              "Add book metadata",
              "Review low-availability titles",
              "Audit category balance",
            ]}
          />
          <MegaMenuSection
            title="Members"
            items={[
              "Review member activity",
              "Flag inactive accounts",
              "Prepare outreach list",
            ]}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MegaMenuSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] bg-background/80 p-4 ring-1 ring-black/5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-[var(--library-ink-soft)] transition-colors hover:bg-[var(--library-panel-strong)] hover:text-foreground"
          >
            {item}
            <ArrowUpRightIcon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

function DashboardSummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {cardMeta.map((item) => {
        const Icon = item.icon
        const value = summary.cards[item.key]
        const accent = item.key === "overdueLoans"

        return (
          <Card key={item.key} className="rounded-[28px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription className="text-[var(--library-ink-soft)]">
                    {item.label}
                  </CardDescription>
                  <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
                    {value}
                  </CardTitle>
                </div>
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-[18px]",
                    accent
                      ? "bg-destructive/10 text-destructive"
                      : "bg-[var(--library-panel-strong)] text-[var(--library-accent)]"
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--library-ink-soft)]">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LibraryActivityCard({ summary }: { summary: DashboardSummary }) {
  const totalCopies = Math.max(summary.cards.totalCopies, 1)
  const availablePct = Math.round((summary.cards.availableCopies / totalCopies) * 100)
  const borrowedPct = Math.round((summary.cards.borrowedCopies / totalCopies) * 100)

  return (
    <Card className="rounded-[32px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold">Circulation Snapshot</CardTitle>
            <CardDescription className="mt-1 text-[var(--library-ink-soft)]">
              A quick view of copy availability and current borrowing load.
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full border-border bg-background/80 text-[var(--library-ink-soft)]">
            Live Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatStrip label="Available copies" value={summary.cards.availableCopies} percentage={availablePct} />
          <StatStrip label="Borrowed copies" value={summary.cards.borrowedCopies} percentage={borrowedPct} />
        </div>

        <div className="rounded-[24px] bg-background/80 p-4 ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Overview Notes</p>
            <ArrowUpRightIcon className="size-4 text-[var(--library-ink-soft)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniNote label="Catalog health" value={`${summary.cards.totalBooks} books across ${summary.cards.totalCategories} categories`} />
            <MiniNote label="Member base" value={`${summary.cards.totalMembers} active and archived members in the system`} />
            <MiniNote label="Risk watch" value={`${summary.cards.overdueLoans} overdue loans currently require follow-up`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverduePanel({ loans }: { loans: SummaryLoan[] }) {
  return (
    <Card className="rounded-[32px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Overdue Watchlist</CardTitle>
        <CardDescription className="text-[var(--library-ink-soft)]">
          Borrowers that need immediate return reminders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loans.length === 0 ? (
          <div className="rounded-[24px] bg-background/80 p-4 text-sm text-[var(--library-ink-soft)] ring-1 ring-black/5">
            No overdue loans match the current search.
          </div>
        ) : (
          loans.map((loan) => (
            <div key={loan.id} className="rounded-[24px] bg-background/80 p-4 ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{loan.memberName}</p>
                  <p className="mt-1 text-sm text-[var(--library-ink-soft)]">{loan.bookTitle}</p>
                </div>
                <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/10">
                  Overdue
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[var(--library-ink-soft)]">
                <span>Copy {loan.copyCode}</span>
                <span>Due {formatDate(loan.dueDate)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function RecentBooksCard({ books }: { books: SummaryBook[] }) {
  return (
    <Card className="rounded-[32px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Books</CardTitle>
        <CardDescription className="text-[var(--library-ink-soft)]">
          The latest catalog entries currently tracked in the library.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-black/5 hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length === 0 ? (
              <TableRow className="border-black/5">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-[var(--library-ink-soft)]">
                  No books match the current search and filters.
                </TableCell>
              </TableRow>
            ) : (
              books.map((book) => (
                <TableRow key={book.id} className="border-black/5">
                  <TableCell className="whitespace-normal">
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="mt-1 text-xs text-[var(--library-ink-soft)]">{book.author}</p>
                    </div>
                  </TableCell>
                  <TableCell>{book.categoryName}</TableCell>
                  <TableCell className="text-right font-medium">{book.availableCopies}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RecentLoansCard({ loans }: { loans: SummaryLoan[] }) {
  return (
    <Card className="rounded-[32px] bg-[var(--library-panel)] shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Loans</CardTitle>
        <CardDescription className="text-[var(--library-ink-soft)]">
          Newest circulation activity from the real loan ledger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-black/5 hover:bg-transparent">
              <TableHead>Member</TableHead>
              <TableHead>Book</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length === 0 ? (
              <TableRow className="border-black/5">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-[var(--library-ink-soft)]">
                  No loans match the current search and filter scope.
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan) => (
                <TableRow key={loan.id} className="border-black/5">
                  <TableCell className="whitespace-normal">
                    <div>
                      <p className="font-medium">{loan.memberName}</p>
                      <p className="mt-1 text-xs text-[var(--library-ink-soft)]">Copy {loan.copyCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">{loan.bookTitle}</TableCell>
                  <TableCell className="text-right">
                    <LoanStatusBadge status={loan.status} isOverdue={loan.isOverdue} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatStrip({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div className="rounded-[24px] bg-background/80 p-4 ring-1 ring-black/5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--library-ink-soft)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <Badge variant="outline" className="rounded-full border-border bg-[var(--library-panel-strong)] text-[var(--library-ink-soft)]">
          {percentage}%
        </Badge>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--library-panel-strong)]">
        <div
          className="h-2 rounded-full bg-[var(--library-accent)]"
          style={{ width: `${Math.min(Math.max(percentage, 4), 100)}%` }}
        />
      </div>
    </div>
  )
}

function MiniNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[var(--library-panel)] p-3 ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--library-ink-soft)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  )
}

function LoanStatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (isOverdue) {
    return <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/10">Overdue</Badge>
  }

  if (status === "returned") {
    return <Badge variant="outline" className="rounded-full border-border bg-[var(--library-panel-strong)] text-[var(--library-ink-soft)]">Returned</Badge>
  }

  return <Badge className="rounded-full bg-[var(--library-accent)] text-[var(--library-accent-foreground)] hover:bg-[var(--library-accent)]">Borrowed</Badge>
}

function formatDate(value: string | Date | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}
