#!/usr/bin/env bash
# deploy.sh — deploy library app + MinIO via docker run.
# Routing dan SSL ditangani coolify-proxy (Traefik) — tidak perlu Nginx.
#
# Domains:
#   https://library.beres.io       → Next.js app (port 3000)
#   https://minio.library.beres.io → MinIO S3 API (port 9000)
#   http://127.0.0.1:9001          → MinIO console (lokal saja, akses via SSH tunnel)
#
# Usage (dari root repo):
#   cp deploy/.env.production.example .env.production
#   # isi .env.production
#   bash deploy/deploy.sh

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ditemukan. Copy dari deploy/.env.production.example dan isi nilainya."
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

NETWORK=coolify
MINIO_CONTAINER=library_minio
APP_CONTAINER=library_app
APP_IMAGE=library-app

# ── MinIO ─────────────────────────────────────────────────────────────────────
if docker ps -a --format '{{.Names}}' | grep -q "^${MINIO_CONTAINER}$"; then
  echo "[deploy] container MinIO sudah ada — dilewati (stop manual untuk recreate)."
else
  echo "[deploy] menjalankan MinIO..."
  docker run -d \
    --name "$MINIO_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -p 127.0.0.1:9001:9001 \
    -v library_minio_data:/data \
    -e MINIO_ROOT_USER="${MINIO_ROOT_USER}" \
    -e MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}" \
    -l traefik.enable=true \
    -l "traefik.http.routers.library-minio.rule=Host(\`minio.library.beres.io\`)" \
    -l traefik.http.routers.library-minio.entrypoints=https \
    -l traefik.http.routers.library-minio.tls=true \
    -l traefik.http.routers.library-minio.tls.certresolver=letsencrypt \
    -l traefik.http.services.library-minio.loadbalancer.server.port=9000 \
    minio/minio server /data --console-address ":9001"
  echo "[deploy] MinIO berjalan."
fi

# ── App ───────────────────────────────────────────────────────────────────────
echo "[deploy] build image '$APP_IMAGE'..."
docker build \
  --build-arg MINIO_PUBLIC_HOST="${MINIO_PUBLIC_HOST:-minio.library.beres.io}" \
  --build-arg MINIO_PORT="${MINIO_PORT:-9000}" \
  --build-arg MINIO_USE_SSL="${MINIO_USE_SSL:-false}" \
  --build-arg MINIO_PUBLIC_PORT="${MINIO_PUBLIC_PORT:-443}" \
  -t "$APP_IMAGE" \
  .

echo "[deploy] menghentikan container app lama (jika ada)..."
docker stop "$APP_CONTAINER" 2>/dev/null || true
docker rm   "$APP_CONTAINER" 2>/dev/null || true

echo "[deploy] menjalankan container app..."
docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -l traefik.enable=true \
  -l "traefik.http.routers.library-app.rule=Host(\`library.beres.io\`)" \
  -l traefik.http.routers.library-app.entrypoints=https \
  -l traefik.http.routers.library-app.tls=true \
  -l traefik.http.routers.library-app.tls.certresolver=letsencrypt \
  -l traefik.http.services.library-app.loadbalancer.server.port=3000 \
  "$APP_IMAGE"

echo ""
echo "[deploy] selesai."
echo "  App:           https://library.beres.io"
echo "  MinIO API:     https://minio.library.beres.io"
echo "  MinIO console: http://127.0.0.1:9001  (SSH tunnel: ssh -L 9001:127.0.0.1:9001 user@vps)"
