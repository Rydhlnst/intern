# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server (Next.js + Turbopack)
npm run build        # production build
npm run lint         # ESLint

npm run db:generate  # generate Drizzle migration from schema changes
npm run db:migrate   # apply pending migrations to the database
npm run db:seed      # seed database (idempotent — safe to re-run)
npm run db:studio    # open Drizzle Studio (DB GUI)

docker compose up -d # start postgres (5433), MinIO (9000/9001), adminer (8080)
```

Seed credentials: `admin@example.com`, `librarian@example.com`, `staff@example.com`, `reader@example.com` — all with password `password`.

## Architecture

### Two distinct surfaces

The app has two independent surfaces that share the same database but have different auth postures:

1. **Public Discover page** (`/`) — session-optional. `getSession()` is called; if unauthenticated, data queries return empty reader collections and auth-only sidebar nav items (My Library, Bookmark, Favorite, History, Log out) are hidden. `/books/[id]` is also public — it uses `getSession()` but no `requirePermission`.
2. **Management routes** (`/dashboard`, `/books`, `/categories`, `/loans`, `/members`, `/users`) — every server action and page starts with `requirePermission()`, which redirects to `/login` if unauthenticated and throws if the role lacks the permission. There are no route-group middleware files; protection is applied per-page/per-action.

**What's built:** `/dashboard`, `/books/[id]` (public detail), `/login`, `/signup`. The server layer (actions + DB queries) is complete for books and categories — only the management list/form pages are missing.

**What's missing (UI only):** `/books` list page, `/categories` page, `/members`, `/loans`, `/users`.

### Auth — better-auth (not NextAuth)

- **Server:** `getSession()` / `requireAuth()` / `requirePermission(permission)` from `@/auth/guards`
- **Client:** `authClient` from `@/lib/auth-client` (`createAuthClient()` from `better-auth/react`)
- **API route:** `src/app/api/auth/[...all]/route.ts` — catch-all forwarded to better-auth
- New users automatically get a `members` row inserted via `databaseHooks.user.create.after` in `src/auth/config.ts`

### RBAC — `src/auth/permissions.ts`

Four roles: `super_admin | librarian | staff | reader`. `checkPermission(role, permission)` throws `new Error("Forbidden")` — it is an `Error` object, not a plain string. `hasPermission(role, permission)` returns a boolean for conditional UI. All permission strings live in the `Permission` type in that file.

### Server actions pattern

Every server action must follow this shape:

```ts
"use server"
export async function myAction(input: FormData | object): Promise<ActionResult<T>> {
  const user = await requirePermission("some:permission")  // first line — auth gate
  const parsed = parseInput(MySchema, input)
  if (!parsed.success) return parsed.result
  // ... mutation ...
  revalidatePath("/some-path")
  return actionOk(data)
}
```

`ActionResult<T>`, `actionOk()`, `actionError()`, `parseInput()`, and `isUniqueViolation()` all come from `@/lib/action-result`. Permission failures throw; validation/business failures return `{ ok: false }`. Never throw from an action for expected failures.

### Database — Drizzle ORM + postgres.js

- DB client: `import { db } from "@/db"`
- Schema: `import { tableName } from "@/db/schema"`
- All read queries are in `src/db/queries/` (one file per domain)
- Mutations happen inside server actions in `src/actions/`
- Full-text search on books uses GIN trigram indexes on `title`, `author`, `publisher` — use `ilike` with `%term%` rather than `ts_vector`
- The `loans` table has a unique partial index preventing two active loans on the same copy
- `getBooks(filters: BookFilters)` in `src/db/queries/books.ts` already supports `search` (title/author/publisher/isbn), `categoryId`, `startDate`/`endDate` (publication date range), `availability`, `hasCover`, and pagination — use it for the books list page instead of writing new queries
- `getCategories()` in `src/db/queries/categories.ts` returns all categories with a `bookCount` join

### Rich text — Tiptap

`books.description` and `book_reviews.contentJson` are stored as `TiptapDoc` (Postgres `jsonb`). Never store or render these as HTML strings.

- **Editing:** `<Editor />` in `src/components/editor/`
- **Displaying:** `<RichView doc={…} />` in the same directory
- **Extensions:** always use `buildExtensions()` from `@/lib/tiptap/extensions` — must be consistent between write and read paths
- **Empty value:** `emptyTiptapDoc` from `@/lib/tiptap/types`
- **Text extraction:** `extractText(doc, maxLength)` from `@/lib/tiptap/extract-text` for metadata/search

### File storage — MinIO via S3 SDK

Book covers are stored in MinIO. `uploadBookCover()` and `deleteBookCover()` in `src/lib/storage/upload-cover.ts` handle the full lifecycle: resize to 400×600 WebP via `sharp`, upload to the `library-covers` bucket, return a public URL. `next.config.ts` allowlists the MinIO hostname for `next/image`.

### Email — stub only

`emailService` from `@/lib/email/service.ts` is a no-op `PlannedEmailService`. Calling `emailService.plan(message)` records intent but sends nothing. It is marked `"server-only"`. Six template keys are defined in `EmailTemplateKey`. When wiring a real provider (e.g., Resend), implement the `EmailService` interface and swap the export.

### UI stack

- **Components:** shadcn/ui primitives in `src/components/ui/` — the underlying primitive is `@base-ui/react`, so `Button` does **not** support `asChild`. Use `buttonVariants()` applied to a `<Link>` for anchor-styled buttons.
- **Tailwind v4** — PostCSS-based, no `tailwind.config.js`. CSS variables are defined in `src/app/globals.css`. Custom design tokens use the `--library-*` prefix. `--primary` maps to the library accent green (`--library-accent`), so the default `<Button>` variant is green — do not hardcode `bg-[var(--library-accent)]` on new buttons.
- **Toasts:** `sonner` — `toast.success()` / `toast.error()` from `sonner`
- **Tables:** `@tanstack/react-table` — shared wrapper at `src/components/data-table.tsx`
- **Forms:** `react-hook-form` + `zod` + `@hookform/resolvers`

### Pagination

`getPagination(page, pageSize?)` from `@/lib/pagination` returns `{ limit, offset }`. Wrap paginated query results with `paginated(items, total, page, pageSize)` to get a `Paginated<T>`. `DEFAULT_PAGE_SIZE` is 10.
