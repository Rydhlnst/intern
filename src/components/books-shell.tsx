"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ImageIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { createBook, getBookForEdit, updateBook, deleteBook } from "@/actions/books"
import { bookSchema, type BookFormData } from "@/lib/validations/book"
import type { getBooks, BookFilters } from "@/db/queries/books"
import type { getCategories } from "@/db/queries/categories"
import { cn } from "@/lib/utils"
import { emptyTiptapDoc, type TiptapDoc } from "@/lib/tiptap/types"
import { RichEditor } from "@/components/editor/rich-editor"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type BookRow = {
  id: number
  title: string
  author: string
  isbn: string | null
  publicationDate: Date | string | null
  publisher: string | null
  numberOfPages: number | null
  coverUrl: string | null
  createdAt: Date | string
  categoryId: number
  categoryName: string
  totalCopies: number
  availableCopies: number
  borrowedCopies: number
}
type Category = Awaited<ReturnType<typeof getCategories>>[number]
type PaginatedBooks = Omit<Awaited<ReturnType<typeof getBooks>>, "rows"> & { rows: BookRow[] }

type BooksShellProps = {
  books: PaginatedBooks
  categories: Category[]
  filters: BookFilters
  canManage: boolean
}

// ─── CoverInput ─────────────────────────────────────────────────────────────
// Defined before BooksShell to avoid Turbopack hoisting issues.

type CoverInputProps = {
  existingUrl: string | null
  file: File | null
  removed: boolean
  onFile: (f: File | null) => void
  onRemove: () => void
  onRestore: () => void
}

function CoverInput({ existingUrl, file, removed, onFile, onRemove, onRestore }: CoverInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const preview = file ? URL.createObjectURL(file) : null
  const current = removed ? null : existingUrl

  return (
    <div className="flex items-start gap-4">
      <div className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {preview || current ? (
          <Image
            src={preview ?? current!}
            alt="Cover preview"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl h-7 px-2.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          {current || preview ? "Change cover" : "Upload cover"}
        </Button>
        {(current || preview) && !removed && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl h-7 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={file ? () => onFile(null) : onRemove}
          >
            Remove
          </Button>
        )}
        {removed && existingUrl && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl h-7 px-2.5 text-xs"
            onClick={onRestore}
          >
            Restore
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            onFile(f)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}

// ─── SortHeader ──────────────────────────────────────────────────────────────

function SortHeader({ label, className }: { label: string; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-left font-medium text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ChevronsUpDownIcon className="size-3.5 opacity-50" />
      </span>
    </th>
  )
}

// ─── BooksTable ──────────────────────────────────────────────────────────────

type BooksTableProps = {
  rows: BookRow[]
  canManage: boolean
  deleteId: number | null
  isPending: boolean
  onEdit: (book: BookRow) => void
  onDeleteRequest: (id: number) => void
  onDeleteConfirm: (id: number) => void
  onDeleteCancel: () => void
}

function BooksTable({
  rows,
  canManage,
  deleteId,
  isPending,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: BooksTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="pl-4 pr-2 py-3 w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-2 py-3 w-8" />
              <SortHeader label="Title" />
              <SortHeader label="Publisher" className="hidden lg:table-cell" />
              <SortHeader label="Year" className="hidden sm:table-cell w-24 text-center" />
              <SortHeader label="Copies" className="w-24 text-center" />
              {canManage && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-32">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((book) => {
              const isSelected = selected.has(book.id)
              return (
              <tr
                key={book.id}
                data-state={isSelected ? "selected" : undefined}
                className="hover:bg-muted/20 data-[state=selected]:bg-muted/40 transition-colors"
              >
                {/* Select */}
                <td className="pl-4 pr-2 py-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(book.id)}
                    aria-label={`Select ${book.title}`}
                  />
                </td>
                {/* Cover */}
                <td className="px-2 py-2">
                  {book.coverUrl ? (
                    <div className="relative h-10 w-7 overflow-hidden rounded-md bg-muted shrink-0">
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <BookOpenIcon className="size-4 text-muted-foreground/60" />
                  )}
                </td>
                {/* Title + author + category */}
                <td className="px-4 py-2">
                  <Link
                    href={`/books/${book.id}`}
                    className="font-medium hover:underline line-clamp-1"
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {book.author}
                    <span className="mx-1.5 opacity-40">·</span>
                    <Badge
                      variant="outline"
                      className="rounded-full border-border text-[10px] py-0 px-1.5 font-normal"
                    >
                      {book.categoryName}
                    </Badge>
                  </p>
                </td>
                {/* Publisher */}
                <td className="px-4 py-2 text-muted-foreground hidden lg:table-cell max-w-[180px]">
                  <span className="line-clamp-1">{book.publisher}</span>
                </td>
                {/* Year */}
                <td className="px-4 py-2 text-center text-muted-foreground hidden sm:table-cell tabular-nums">
                  {book.publicationDate ? new Date(book.publicationDate).getFullYear() : "—"}
                </td>
                {/* Copies */}
                <td className="px-4 py-2 text-center">
                  <span className="tabular-nums text-xs">
                    <span className="font-medium text-foreground">{book.availableCopies}</span>
                    <span className="text-muted-foreground">/{book.totalCopies}</span>
                  </span>
                </td>
                {/* Actions */}
                {canManage && (
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {deleteId === book.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-destructive font-medium">Delete?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 rounded-xl px-2.5 text-xs"
                            onClick={() => onDeleteConfirm(book.id)}
                            disabled={isPending}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-xl px-2.5 text-xs"
                            onClick={onDeleteCancel}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => onEdit(book)}
                            title="Edit"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteRequest(book.id)}
                            title="Delete"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 7 : 6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No books found. Try adjusting filters or add a new book.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getPageNumbers(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | "..."> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("...")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("...")
  pages.push(total)
  return pages
}

// ─── BooksShell ──────────────────────────────────────────────────────────────

export function BooksShell({ books, categories, filters, canManage }: BooksShellProps) {
  const router = useRouter()

  // Filter bar state (controlled inputs before URL push)
  const [search, setSearch] = useState(filters.search ?? "")
  const [categoryId, setCategoryId] = useState(
    filters.categoryId ? String(filters.categoryId) : ""
  )
  const [fromDate, setFromDate] = useState(filters.startDate ?? "")
  const [toDate, setToDate] = useState(filters.endDate ?? "")

  // Table state
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Sheet / form state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editBookId, setEditBookId] = useState<number | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookSchema) as unknown as Resolver<BookFormData>,
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      publicationDate: "",
      publisher: "",
      numberOfPages: 1,
      categoryId: 0,
      description: null,
    },
  })

  // ── Filter helpers ──────────────────────────────────────────────────────────

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = {
      q: search || undefined,
      category: categoryId || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      ...overrides,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    return `/dashboard/books?${params.toString()}`
  }

  function applyFilters(overrides: Record<string, string | undefined> = {}) {
    router.push(buildUrl(overrides))
  }

  function clearFilters() {
    setSearch("")
    setCategoryId("")
    setFromDate("")
    setToDate("")
    router.push("/dashboard/books")
  }

  const hasFilters = !!(filters.search || filters.categoryId || filters.startDate || filters.endDate)

  // ── Sheet helpers ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditBookId(null)
    setExistingCoverUrl(null)
    setCoverFile(null)
    setRemoveCover(false)
    form.reset({
      title: "",
      author: "",
      isbn: "",
      publicationDate: "",
      publisher: "",
      numberOfPages: 1,
      categoryId: categories[0]?.id ?? 0,
      description: null,
    })
    setSheetOpen(true)
  }

  async function openEdit(book: BookRow) {
    setEditBookId(book.id)
    setCoverFile(null)
    setRemoveCover(false)
    setLoadingEdit(true)
    setSheetOpen(true)

    const result = await getBookForEdit(book.id)
    if (!result.ok) {
      toast.error(result.error ?? "Failed to load book details.")
      setSheetOpen(false)
      setLoadingEdit(false)
      return
    }
    if (!result.data) {
      toast.error("Failed to load book details.")
      setSheetOpen(false)
      setLoadingEdit(false)
      return
    }

    const d = result.data
    setExistingCoverUrl(d.coverUrl)
    form.reset({
      title: d.title,
      author: d.author,
      isbn: d.isbn ?? "",
      publicationDate: d.publicationDate,
      publisher: d.publisher,
      numberOfPages: d.numberOfPages,
      categoryId: d.categoryId,
      description: d.description,
    })
    setLoadingEdit(false)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setIsPending(true)
    try {
      const fd = new FormData()
      fd.set("title", data.title)
      fd.set("author", data.author)
      if (data.isbn) fd.set("isbn", data.isbn)
      fd.set("publicationDate", data.publicationDate)
      fd.set("publisher", data.publisher)
      fd.set("numberOfPages", String(data.numberOfPages))
      fd.set("categoryId", String(data.categoryId))
      if (data.description) fd.set("description", JSON.stringify(data.description))
      if (coverFile) fd.set("cover", coverFile)
      if (removeCover) fd.set("removeCover", "true")

      const result = editBookId
        ? await updateBook(editBookId, fd)
        : await createBook(fd)

      if (!result.ok) { toast.error(result.error); return }
      toast.success(editBookId ? "Book updated." : "Book created.")
      setSheetOpen(false)
      setCoverFile(null)
      setRemoveCover(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  })

  async function handleDelete(id: number) {
    setIsPending(true)
    try {
      const result = await deleteBook(id)
      if (!result.ok) { toast.error(result.error); return }
      toast.success("Book deleted.")
      setDeleteId(null)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search title, author, publisher…"
            className="pl-8 rounded-2xl h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ q: search || undefined, page: undefined })
            }}
          />
        </div>

        {/* Category */}
        <select
          className="h-9 rounded-2xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-40"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            applyFilters({ category: e.target.value || undefined, page: undefined })
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* From date */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <input
            type="date"
            className="h-9 rounded-2xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              applyFilters({ from: e.target.value || undefined, page: undefined })
            }}
          />
        </div>

        {/* To date */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
          <input
            type="date"
            className="h-9 rounded-2xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value)
              applyFilters({ to: e.target.value || undefined, page: undefined })
            }}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            className="h-9 rounded-2xl px-3 gap-1.5 text-muted-foreground"
            onClick={clearFilters}
          >
            <XIcon className="size-3.5" />
            Clear
          </Button>
        )}

        {/* Spacer + Add button */}
        <div className="flex-1" />
        {canManage && (
          <Button size="sm" className="rounded-2xl gap-1.5" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Book
          </Button>
        )}
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {books.total} {books.total === 1 ? "book" : "books"}
          {hasFilters && " matching filters"}
        </span>
      </div>

      {/* Table */}
      <BooksTable
        rows={books.rows}
        canManage={canManage}
        deleteId={deleteId}
        isPending={isPending}
        onEdit={openEdit}
        onDeleteRequest={(id) => setDeleteId(id)}
        onDeleteConfirm={handleDelete}
        onDeleteCancel={() => setDeleteId(null)}
      />

      {/* Pagination */}
      {books.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">
              {(books.page - 1) * books.limit + 1}-
              {Math.min(books.page * books.limit, books.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{books.total}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 rounded-lg text-muted-foreground"
              disabled={books.page <= 1}
              onClick={() =>
                applyFilters({ page: books.page > 2 ? String(books.page - 1) : undefined })
              }
            >
              <ChevronLeftIcon className="size-3.5" />
              Previous
            </Button>
            {getPageNumbers(books.page, books.totalPages).map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  size="sm"
                  variant={p === books.page ? "default" : "ghost"}
                  className={cn(
                    "h-8 w-8 rounded-lg p-0 tabular-nums",
                    p === books.page
                      ? "bg-[var(--library-accent)] text-[var(--library-accent-foreground)] hover:bg-[var(--library-accent)]"
                      : "text-muted-foreground"
                  )}
                  onClick={() =>
                    applyFilters({ page: p > 1 ? String(p) : undefined })
                  }
                >
                  {p}
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 rounded-lg text-muted-foreground"
              disabled={books.page >= books.totalPages}
              onClick={() => applyFilters({ page: String(books.page + 1) })}
            >
              Next
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Book form sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="data-[side=right]:sm:max-w-lg overflow-y-auto flex flex-col"
        >
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle>{editBookId ? "Edit Book" : "Add Book"}</SheetTitle>
            <SheetDescription>
              {editBookId
                ? "Update book details below."
                : "Fill in the details to add a new book to the catalog."}
            </SheetDescription>
          </SheetHeader>

          {loadingEdit ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Cover */}
                <FieldGroup>
                  <Field>
                    <FieldLabel>Cover image</FieldLabel>
                    <CoverInput
                      existingUrl={existingCoverUrl}
                      file={coverFile}
                      removed={removeCover}
                      onFile={setCoverFile}
                      onRemove={() => setRemoveCover(true)}
                      onRestore={() => setRemoveCover(false)}
                    />
                  </Field>
                </FieldGroup>

                <div className="border-t border-border" />

                <FieldGroup>
                  {/* Title */}
                  <Field>
                    <FieldLabel htmlFor="book-title">Title</FieldLabel>
                    <Input
                      id="book-title"
                      placeholder="Book title"
                      {...form.register("title")}
                    />
                    <FieldError errors={[form.formState.errors.title]} />
                  </Field>

                  {/* Author */}
                  <Field>
                    <FieldLabel htmlFor="book-author">Author</FieldLabel>
                    <Input
                      id="book-author"
                      placeholder="Author name"
                      {...form.register("author")}
                    />
                    <FieldError errors={[form.formState.errors.author]} />
                  </Field>

                  {/* Publisher + ISBN (side by side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="book-publisher">Publisher</FieldLabel>
                      <Input
                        id="book-publisher"
                        placeholder="Publisher"
                        {...form.register("publisher")}
                      />
                      <FieldError errors={[form.formState.errors.publisher]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="book-isbn">ISBN</FieldLabel>
                      <Input
                        id="book-isbn"
                        placeholder="Optional"
                        {...form.register("isbn")}
                      />
                    </Field>
                  </div>

                  {/* Publication date + Pages (side by side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="book-date">Publication date</FieldLabel>
                      <input
                        id="book-date"
                        type="date"
                        className="flex h-9 w-full rounded-2xl border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("publicationDate")}
                      />
                      <FieldError errors={[form.formState.errors.publicationDate]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="book-pages">Pages</FieldLabel>
                      <Input
                        id="book-pages"
                        type="number"
                        min={1}
                        placeholder="e.g. 320"
                        {...form.register("numberOfPages")}
                      />
                      <FieldError errors={[form.formState.errors.numberOfPages]} />
                    </Field>
                  </div>

                  {/* Category */}
                  <Field>
                    <FieldLabel htmlFor="book-category">Category</FieldLabel>
                    <select
                      id="book-category"
                      className="flex h-9 w-full rounded-2xl border border-input bg-transparent px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("categoryId")}
                    >
                      <option value={0}>Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[form.formState.errors.categoryId]} />
                  </Field>

                  {/* Description */}
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <div className="rounded-2xl border border-input bg-transparent overflow-hidden">
                      <Controller
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <RichEditor
                            value={field.value ?? emptyTiptapDoc}
                            onChange={(doc: TiptapDoc) => field.onChange(doc)}
                            placeholder="Write a description for this book…"
                            className="min-h-32"
                          />
                        )}
                      />
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0">
                <Button type="submit" className="w-full rounded-2xl" disabled={isPending}>
                  {isPending
                    ? "Saving…"
                    : editBookId
                      ? "Save changes"
                      : "Add book"}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

