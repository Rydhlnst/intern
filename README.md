# Library Management System

A Next.js 16 + Drizzle + PostgreSQL application with two clearly separated flows:

- Public flow: catalog browsing for readers and guests
- Dashboard flow: authenticated management for staff and admins

## Route Structure

The app now uses App Router route groups so public pages and dashboard pages do not live in the same route tree internally.

- `src/app/(public)`
  - Public-facing routes only
  - Current routes:
    - `/` -> redirects to `/discover`
    - `/discover`
    - `/discover/categories`
    - `/discover/download`
    - `/books/[id]`
    - `/login`
    - `/signup`
- `src/app/(dashboard)`
  - Dashboard and dashboard compatibility routes
  - Current routes:
    - `/dashboard`
    - `/dashboard/books`
    - `/dashboard/categories`
    - `/books` -> redirects to `/dashboard/books`
    - `/categories` -> redirects to `/dashboard/categories`

## Flow Overview

### Public Flow

Purpose:
- Fast public catalog access
- Isolated pages for Discover, Category, and Download
- Lower payload than the previous all-in-one public client shell

Current public routes:
- `/discover`: public catalog search and filtered book listing
- `/discover/categories`: category-first public browsing page
- `/discover/download`: dedicated download surface placeholder
- `/books/[id]`: public book detail page with reviews

Public caching:
- Public catalog data is cached with `unstable_cache`
- Cache key layer lives in [src/db/queries/public-discover.ts](src/db/queries/public-discover.ts)
- Current cache config:
  - `revalidate: 300`
  - tag: `public-discover`
- This is server-side route/data caching for faster repeated requests

Public query behavior:
- Search covers:
  - title
  - author
  - publisher
- Category filter uses category slug from the URL
- Public routes are server-rendered and use dedicated route pages

### Dashboard Flow

Purpose:
- Protected management surface for library staff
- Book and category CRUD
- Dashboard metrics and admin filtering

Current dashboard routes:
- `/dashboard`: overview and catalog summary
- `/dashboard/books`: book list, filters, create/update/delete
- `/dashboard/categories`: category list, create/update/delete

Dashboard layout behavior:
- Shared dashboard shell now lives in `src/app/(dashboard)/dashboard/layout.tsx`
- Sidebar and dashboard container are owned by the dashboard layout, not repeated in every page
- Each dashboard page is responsible only for:
  - permission checks
  - page-specific data loading
  - rendering page content

Dashboard auth behavior:
- Layout requires authenticated active user via `requireAuth`
- Individual pages still enforce page-level permission checks via `requirePermission`

## Database

Database stack:
- PostgreSQL
- Drizzle ORM
- `postgres` driver

Important files:
- Schema: [src/db/schema.ts](src/db/schema.ts)
- DB client: [src/db/index.ts](src/db/index.ts)
- Drizzle config: [drizzle.config.ts](drizzle.config.ts)

Main tables used in these flows:
- `book_categories`
- `books`
- `book_copies`
- `book_reviews`
- `reader_bookmarks`
- `reader_favorites`
- `reader_history`
- `user`

## CRUD Status

Implemented:
- Create/Update/Delete Book Categories
- Create/Update/Delete Books
- View Book Categories list
- View Books list
- Filter Books by Category
- Filter Books by search text
- Filter Books by Publication Date

## Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm run dev
```

Open:
- Public flow: `http://localhost:3000/discover`
- Dashboard flow: `http://localhost:3000/dashboard`

## Verification Notes

Recommended checks after changes:
```bash
node node_modules/eslint/bin/eslint.js src/app src/components src/db
```

If you want to validate route behavior manually, check:
- `/discover`
- `/discover/categories`
- `/discover/download`
- `/books/[id]`
- `/dashboard`
- `/dashboard/books`
- `/dashboard/categories`

## Next Suggested Work

- Move remaining public-only helpers out of old legacy files if no longer used
- Add tag-based cache invalidation for public catalog data after admin mutations
- Implement real file delivery for `/discover/download`
- Add explicit unauthorized page for dashboard permission failures
