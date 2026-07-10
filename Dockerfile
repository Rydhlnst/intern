# ---- Base ----
FROM node:20-alpine AS base

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time values baked into the standalone server config (remotePatterns)
ARG MINIO_PUBLIC_HOST=localhost
ARG MINIO_PORT=9000
ARG MINIO_USE_SSL=false
ENV MINIO_PUBLIC_HOST=$MINIO_PUBLIC_HOST
ENV MINIO_PORT=$MINIO_PORT
ENV MINIO_USE_SSL=$MINIO_USE_SSL
RUN npm run build

# ---- Migrator (one-shot: migrate + seed) ----
FROM base AS migrator
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-c", "npx drizzle-kit migrate && npx tsx src/db/seed.ts"]

# ---- Runner ----
FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
