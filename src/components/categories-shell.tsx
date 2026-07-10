"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BookOpenTextIcon, FolderKanbanIcon, FolderOpenIcon, FolderIcon, PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createCategory, updateCategory, deleteCategory } from "@/actions/categories"
import { categorySchema, type CategoryFormData } from "@/lib/validations/category"
import type { getCategories } from "@/db/queries/categories"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type Category = Awaited<ReturnType<typeof getCategories>>[number]

export function CategoriesShell({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  })

  function openCreate() {
    setEditItem(null)
    form.reset({ name: "", description: "" })
    setSheetOpen(true)
  }

  function openEdit(cat: Category) {
    setEditItem(cat)
    form.reset({ name: cat.name, description: cat.description ?? "" })
    setSheetOpen(true)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setIsPending(true)
    try {
      const result = editItem
        ? await updateCategory(editItem.id, data)
        : await createCategory(data)
      if (!result.ok) { toast.error(result.error); return }
      toast.success(editItem ? "Category updated." : "Category created.")
      setSheetOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  })

  async function handleDelete(id: number) {
    setIsPending(true)
    try {
      const result = await deleteCategory(id)
      if (!result.ok) { toast.error(result.error); setDeleteId(null); return }
      toast.success("Category deleted.")
      setDeleteId(null)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  const totalBooks = categories.reduce((sum, cat) => sum + cat.bookCount, 0)
  const activeCategories = categories.filter((cat) => cat.bookCount > 0).length
  const emptyCategories = categories.filter((cat) => cat.bookCount === 0).length

  const statCards = [
    {
      label: "Total Categories",
      value: categories.length,
      description: "Classification groups in catalog",
      icon: FolderKanbanIcon,
    },
    {
      label: "Total Books",
      value: totalBooks,
      description: "Books across all categories",
      icon: BookOpenTextIcon,
    },
    {
      label: "Active Categories",
      value: activeCategories,
      description: "Categories with at least one book",
      icon: FolderOpenIcon,
    },
    {
      label: "Empty Categories",
      value: emptyCategories,
      description: "Categories with no books yet",
      icon: FolderIcon,
    },
  ] as const

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
                      {card.value}
                    </CardTitle>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-[18px] bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? "category" : "categories"}
        </p>
        <Button size="sm" className="rounded-2xl gap-1.5" onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Category
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Description
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                Books
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs">
                  <span className="line-clamp-1">{cat.description ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" className="rounded-full tabular-nums">
                    {cat.bookCount}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {deleteId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive font-medium">Delete?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 rounded-xl px-2.5 text-xs"
                          onClick={() => handleDelete(cat.id)}
                          disabled={isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-xl px-2.5 text-xs"
                          onClick={() => setDeleteId(null)}
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
                          onClick={() => openEdit(cat)}
                          title="Edit"
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(cat.id)}
                          title="Delete"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  No categories yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle>{editItem ? "Edit Category" : "New Category"}</SheetTitle>
            <SheetDescription>
              {editItem
                ? "Update the name or description below."
                : "Add a new category to organise books in the catalog."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="flex flex-col h-[calc(100%-5rem)]">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="cat-name">Name</FieldLabel>
                  <Input
                    id="cat-name"
                    placeholder="e.g. Science Fiction"
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cat-desc">Description</FieldLabel>
                  <textarea
                    id="cat-desc"
                    placeholder="Brief description of this category…"
                    rows={4}
                    className="flex w-full rounded-2xl border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    {...form.register("description")}
                  />
                </Field>
              </FieldGroup>
            </div>
            <div className="px-6 py-4 border-t border-border">
              <Button type="submit" className="w-full rounded-2xl" disabled={isPending}>
                {isPending ? "Saving…" : editItem ? "Save changes" : "Create category"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
