# Library Management System

A full-stack library management application built with Next.js 16, Drizzle ORM, PostgreSQL, and MinIO. It has two clearly separated surfaces:

- **Public flow** — catalog browsing for readers and guests
- **Dashboard flow** — authenticated management for librarians, staff, and admins

> **Live production:** <https://library.beres.io>

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, standalone output)
- **Database:** PostgreSQL + Drizzle ORM (`postgres` driver)
- **Auth:** better-auth (email/password with RBAC)
- **Storage:** MinIO (S3-compatible) for book covers, processed via `sharp`
- **UI:** Tailwind v4, shadcn/ui on `@base-ui/react`, TanStack Table, Sonner
- **Forms:** react-hook-form + zod
- **Rich text:** Tiptap (stored as JSONB)

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL + MinIO)

### 2. Install and configure

```bash
npm install
cp .env.example .env
```

Then edit `.env` — the defaults work out of the box for local development.

### 3. Start infrastructure (Postgres, MinIO, Adminer)

```bash
docker compose up -d postgres minio createbuckets adminer
```

Services:
- PostgreSQL — `localhost:5433`
- MinIO API — `localhost:9000`
- MinIO Console — `localhost:9001` (login: `minioadmin` / `minioadmin`)
- Adminer (DB GUI) — `localhost:8080`

### 4. Run migrations and seed data

```bash
npm run db:migrate
npm run db:seed
```

The seed is idempotent — you can safely re-run it.

### 5. Start the dev server

```bash
npm run dev
```

Open:
- Public flow: <http://localhost:3000/discover>
- Dashboard flow: <http://localhost:3000/dashboard>

## Test Credentials

The seed script creates one account for each role. Use these to test different permission levels.

**Password for all accounts:** `password`

| Role          | Email                    | Access                                                       |
|---------------|--------------------------|--------------------------------------------------------------|
| Super Admin   | `admin@example.com`      | Full access — user management, all CRUD, all dashboards      |
| Librarian     | `librarian@example.com`  | Books, categories, loans, members management                 |
| Staff         | `staff@example.com`      | Loan processing, member check-in/out                         |
| Reader        | `reader@example.com`     | Public catalog + bookmarks, favorites, borrow history        |

### Quick admin login for testing

**Local:**
1. Go to <http://localhost:3000/login>
2. Email: `admin@example.com`
3. Password: `password`
4. You'll land on `/dashboard` with full access to books and categories.

**Live production:**
1. Go to <https://library.beres.io/login>
2. Use the same seeded credentials above.

## Route Structure

The app uses App Router route groups to isolate public and authenticated surfaces.

### `src/app/(public)` — public routes
- `/` → redirects to `/discover`
- `/discover` — public catalog with search and category filter
- `/discover/categories` — category-first browsing
- `/discover/download` — download surface (placeholder)
- `/books/[id]` — public book detail page with reviews
- `/login`, `/signup`

### `src/app/(dashboard)` — authenticated routes
- `/dashboard` — overview and catalog summary
- `/dashboard/books` — book list, filters, create/update/delete
- `/dashboard/categories` — category list, create/update/delete
- `/books`, `/categories` — legacy redirects into `/dashboard/*`

### Reader routes
- `/bookmark`, `/favorite`, `/history`, `/library` — signed-in reader collections

## Authentication & RBAC

- **Server guards:** `getSession()`, `requireAuth()`, `requirePermission(permission)` from `@/auth/guards`
- **Client:** `authClient` from `@/lib/auth-client`
- **Four roles:** `super_admin`, `librarian`, `staff`, `reader`
- **Permissions:** defined in `src/auth/permissions.ts`
- New users automatically get a `members` row via a `databaseHooks.user.create.after` hook

The public Discover page uses `getSession()` (session-optional). Dashboard routes call `requirePermission()` which redirects unauthenticated users to `/login`.

## Database

- **Schema:** [src/db/schema.ts](src/db/schema.ts)
- **DB client:** [src/db/index.ts](src/db/index.ts)
- **Drizzle config:** [drizzle.config.ts](drizzle.config.ts)
- **Read queries:** `src/db/queries/` (one file per domain)
- **Mutations:** `src/actions/` (server actions)

Main tables: `book_categories`, `books`, `book_copies`, `book_reviews`, `reader_bookmarks`, `reader_favorites`, `reader_history`, `loans`, `members`, `user`.

Book search uses GIN trigram indexes on `title`, `author`, `publisher` (`ilike` with `%term%`).

## Common Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint

npm run db:generate  # generate Drizzle migration from schema changes
npm run db:migrate   # apply pending migrations
npm run db:seed      # seed database (idempotent)
npm run db:studio    # open Drizzle Studio
```

## Deploying with Docker Compose (VPS, single setup)

The repo ships with a full-stack `docker-compose.yml` that runs Postgres, MinIO, migrations, and the Next.js app together.

### 1. Prepare your `.env`

```bash
cp .env.example .env
```

Set at minimum:
- `BETTER_AUTH_SECRET` — a long random string (`openssl rand -base64 32`)
- `BETTER_AUTH_URL` — your public app URL (e.g. `http://<vps-ip>:3000` or `https://library.example.com`)
- `MINIO_PUBLIC_HOST` — public host/IP for MinIO (e.g. `<vps-ip>` or `minio.example.com`) — no `http://` prefix
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` — production MinIO credentials

Notes:
- `MINIO_ENDPOINT=minio` is hardcoded in the app service — it's the internal Docker network name used by the S3 SDK.
- `MINIO_PUBLIC_HOST` is baked into the build (via Docker ARG) because Next.js `remotePatterns` for `next/image` is evaluated at build time.

### 2. Bring the stack up

```bash
docker compose up -d --build
```

This runs:
1. `postgres` (with healthcheck)
2. `minio` + `createbuckets` (creates the `library-covers` bucket)
3. `migrate` (runs `drizzle-kit migrate` + `tsx src/db/seed.ts`, then exits)
4. `app` (starts only after `migrate` succeeds)

### 3. Verify

- App: `http://<vps-ip>:3000`
- MinIO console: `http://<vps-ip>:9001`
- Adminer: `http://<vps-ip>:8080`

Log in with the seeded `admin@example.com` / `password` credentials, then change the admin password immediately for production.

## What's Implemented vs Pending

**Implemented (UI):**
- Public discover, category, and book detail pages
- Signup / login / logout
- Reader bookmarks, favorites, history
- Dashboard overview
- Books CRUD (list, filter by category/search/publication date, create, update, delete)
- Categories CRUD

**Server layer complete but UI missing:**
- `/members` — member management
- `/loans` — loan issuance and returns
- `/users` — user/staff management

## Verification

```bash
npm run lint
npm run build
```

Manual smoke test after changes:
- `/discover`, `/discover/categories`, `/books/[id]`
- `/dashboard`, `/dashboard/books`, `/dashboard/categories`
- Log in as each of the four seeded roles and confirm sidebar visibility differs
