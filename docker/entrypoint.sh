#!/bin/sh
set -e

echo "[startup] running database migrations..."
npx drizzle-kit migrate

echo "[startup] ensuring MinIO bucket exists..."
npx tsx src/scripts/ensure-bucket.ts

echo "[startup] seeding initial data (idempotent)..."
npx tsx src/db/seed.ts || echo "[startup] seed failed (non-fatal), continuing..."

echo "[startup] starting Next.js server..."
exec node server.js
