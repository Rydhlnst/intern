# syntax=docker/dockerfile:1.7
# BuildKit is required for the --mount=type=cache directives below.

# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG MINIO_PUBLIC_HOST=localhost
ARG MINIO_PORT=9000
ARG MINIO_USE_SSL=false
ARG MINIO_PUBLIC_PORT=9000
ENV MINIO_PUBLIC_HOST=$MINIO_PUBLIC_HOST
ENV MINIO_PORT=$MINIO_PORT
ENV MINIO_USE_SSL=$MINIO_USE_SSL
ENV MINIO_PUBLIC_PORT=$MINIO_PUBLIC_PORT
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build

# ---- Runner ----
# Runs migrations, bucket setup, and seed on startup, then starts the server.
# This replaces the previous one-shot `migrate` and `createbuckets` services
# so Coolify sees only long-running containers.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Files needed for startup migrations, seeding, and bucket setup
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./startup-package.json
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Install just the tooling needed for one-time startup tasks (drizzle-kit,
# tsx, and the DB driver they need). Kept separate from the standalone
# node_modules so it doesn't bloat runtime imports.
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-save --prefer-offline --no-audit --no-fund \
      drizzle-kit@^0.31.10 tsx@^4.23.0 drizzle-orm@^0.45.2 postgres@^3.4.9

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./entrypoint.sh"]
