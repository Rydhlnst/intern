#!/usr/bin/env bash
# deploy.sh — build and run the library app + MinIO via docker run + Docker network.
#
# Usage (from repo root):
#   cp deploy/.env.production.example .env.production
#   # fill in .env.production
#   bash deploy/deploy.sh
#
# To update the app after a code change:
#   bash deploy/deploy.sh   # stops old container, rebuilds, starts new one

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy deploy/.env.production.example and fill in values."
  exit 1
fi

# Load env vars for use in this script (build args, etc.)
set -a; source "$ENV_FILE"; set +a

NETWORK=library_network
MINIO_CONTAINER=library_minio
APP_CONTAINER=library_app
APP_IMAGE=library-app

# ── Docker network ────────────────────────────────────────────────────────────
echo "[deploy] ensuring Docker network '$NETWORK'..."
docker network create "$NETWORK" 2>/dev/null || true

# ── MinIO ─────────────────────────────────────────────────────────────────────
if docker ps -a --format '{{.Names}}' | grep -q "^${MINIO_CONTAINER}$"; then
  echo "[deploy] MinIO container already exists — skipping (stop manually to recreate)."
else
  echo "[deploy] starting MinIO..."
  docker run -d \
    --name "$MINIO_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p 127.0.0.1:9000:9000 \
    -p 127.0.0.1:9001:9001 \
    -v library_minio_data:/data \
    -e MINIO_ROOT_USER="${MINIO_ROOT_USER}" \
    -e MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}" \
    minio/minio server /data --console-address ":9001"
  echo "[deploy] MinIO started."
fi

# ── App ───────────────────────────────────────────────────────────────────────
echo "[deploy] building app image '$APP_IMAGE'..."
docker build \
  --build-arg MINIO_PUBLIC_HOST="${MINIO_PUBLIC_HOST:-minio.library.beres.io}" \
  --build-arg MINIO_PORT="${MINIO_PORT:-9000}" \
  --build-arg MINIO_USE_SSL="${MINIO_USE_SSL:-false}" \
  --build-arg MINIO_PUBLIC_PORT="${MINIO_PUBLIC_PORT:-443}" \
  -t "$APP_IMAGE" \
  .

echo "[deploy] stopping old app container (if any)..."
docker stop "$APP_CONTAINER" 2>/dev/null || true
docker rm   "$APP_CONTAINER" 2>/dev/null || true

echo "[deploy] starting app container..."
docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file "$ENV_FILE" \
  "$APP_IMAGE"

echo ""
echo "[deploy] done."
echo "  App:   http://127.0.0.1:3000  (proxied by Nginx at https://library.beres.io)"
echo "  MinIO: http://127.0.0.1:9000  (proxied by Nginx at https://minio.library.beres.io)"
echo "  MinIO console: http://127.0.0.1:9001  (local only — SSH tunnel to access remotely)"
