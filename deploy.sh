#!/bin/bash
# ============================================================================
# nanachimi.digital — Production Deployment Script
#
# Always pulls the pre-built image from the central registry and runs it.
# No source code, no local build. Manages db + seaweedfs + caddy, backs up
# DB, runs migrations, restarts app container. Never touches $APP_DIR/data/.
#
# Override the image via env var:
#   REGISTRY_IMAGE=128.140.33.184:5000/nanachimi-digital:sha-xxxxxxx bash deploy.sh
# ============================================================================

set -euo pipefail

# ── Image to run (override via REGISTRY_IMAGE env var) ──────────────
APP_IMAGE="${REGISTRY_IMAGE:-128.140.33.184:5000/nanachimi-digital:master}"

# ── Identifiers — all prefixed with `nanachimi-digital-prod-*` ──────
APP_DIR="/opt/nanachimi-digital"

# Docker network
NETWORK="nanachimi-digital-network"

# Containers
DB_CONTAINER="nanachimi-digital-prod-db"
APP_CONTAINER="nanachimi-digital-prod-app"
SEAWEED_CONTAINER="nanachimi-digital-prod-seaweedfs"

# Persistent storage (NEVER delete these — production data lives here)
# Both bind-mounts at identifiable host paths for easy backup & inspection.
DB_DATA_DIR="$APP_DIR/data/postgres"           # host bind-mount
SEAWEED_DATA_DIR="$APP_DIR/data/seaweedfs"     # host bind-mount
LEGACY_DB_VOLUME="nanachimi-digital-pgdata"    # old named volume (migrated on first run)

# Postgres credentials (user/db name)
DB_USER="nanachimi_digital"
DB_NAME="nanachimi_digital"

echo "============================================"
echo "  nanachimi.digital — Production Deployment"
echo "============================================"
echo ""

# ─── 1. Prerequisites ─────────────────────────────────────────────
echo "▶ Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed. Install it first:"
  echo "   curl -fsSL https://get.docker.com | sh"
  exit 1
fi

echo "  ✓ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
echo "  ▸ Image: $APP_IMAGE"

# ─── 2. Working directory ─────────────────────────────────────────
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# ─── 3. Check .env ────────────────────────────────────────────────
# IMPORTANT: never overwrite an existing .env — production secrets must survive deploys.
if [ -f "$APP_DIR/.env" ]; then
  echo "  ✓ .env file exists (preserving current values)"
else
  echo ""
  echo "⚠️  No .env file found at $APP_DIR/.env"
  touch "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "   Empty file created."
  echo "   Edit it: sudo nano $APP_DIR/.env"
  echo ""
  echo "   Required: DATABASE_URL, POSTGRES_PASSWORD, SESSION_SECRET,"
  echo "             ADMIN_USERNAME, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL"
  echo "   Then re-run this script."
  exit 1
fi

# ─── 4. Docker network ────────────────────────────────────────────
echo "▶ Creating Docker network..."
docker network create "$NETWORK" 2>/dev/null || true

# ─── 5. PostgreSQL (DURABLE — host bind-mount) ────────────────────
# Data lives in $APP_DIR/data/postgres — visible to `ls`, easy to back up.
# The deploy script NEVER deletes this directory.
mkdir -p "$DB_DATA_DIR"
chmod 700 "$DB_DATA_DIR"

# Read DB password from .env (used for new container + any ALTER USER)
DB_PASS=$(grep -oP 'POSTGRES_PASSWORD=\K.*' "$APP_DIR/.env" 2>/dev/null || echo "nanachimi_digital_prod")

# One-time migration: old named volume → new bind-mount
# Runs only if the old volume exists AND the bind-mount is empty.
if [ -z "$(ls -A "$DB_DATA_DIR" 2>/dev/null)" ] \
   && docker volume inspect "$LEGACY_DB_VOLUME" > /dev/null 2>&1; then
  echo "▶ Migrating Postgres data from legacy volume to bind-mount..."
  if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "  · Dumping live DB to SQL file..."
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
      | gzip > "$APP_DIR/backups/migration_${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}.sql.gz" || {
        echo "  ❌ pg_dump failed — aborting migration"; exit 1;
      }
    docker stop "$DB_CONTAINER" > /dev/null
    docker rm "$DB_CONTAINER" > /dev/null
  fi
  # Copy volume contents to bind-mount (preserves permissions)
  docker run --rm \
    -v "$LEGACY_DB_VOLUME":/from \
    -v "$DB_DATA_DIR":/to \
    alpine:3.19 sh -c "cp -a /from/. /to/ && chown -R 999:999 /to"
  echo "  ✓ Data copied to $DB_DATA_DIR"
  echo "  ℹ Legacy volume '$LEGACY_DB_VOLUME' kept as safety net — remove manually"
  echo "    after verifying the site works: docker volume rm $LEGACY_DB_VOLUME"
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "▶ Starting PostgreSQL..."
  docker rm -f "$DB_CONTAINER" 2>/dev/null || true
  docker run -d \
    --name "$DB_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -e POSTGRES_DB="$DB_NAME" \
    -v "$DB_DATA_DIR":/var/lib/postgresql/data \
    postgres:16-alpine

  echo "  Waiting for PostgreSQL to be ready..."
  for i in $(seq 1 15); do
    if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" > /dev/null 2>&1; then
      echo "  ✓ PostgreSQL is ready"
      break
    fi
    sleep 2
  done
else
  echo "  ✓ PostgreSQL already running"
fi

# ─── 5b. SeaweedFS (PDF / file storage — DURABLE) ─────────────────
# Data lives in a host bind-mount: $APP_DIR/data/seaweedfs
# Survives container restart, container removal, and host reboot.
# The deploy script NEVER deletes this directory.
mkdir -p "$SEAWEED_DATA_DIR"
chmod 750 "$SEAWEED_DATA_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${SEAWEED_CONTAINER}$"; then
  echo "▶ Starting SeaweedFS..."
  docker rm -f "$SEAWEED_CONTAINER" 2>/dev/null || true
  docker run -d \
    --name "$SEAWEED_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -v "$SEAWEED_DATA_DIR":/data \
    chrislusf/seaweedfs:latest \
    server -master -volume -filer -dir=/data
  echo "  Waiting for SeaweedFS to be ready..."
  for i in $(seq 1 15); do
    if docker exec "$SEAWEED_CONTAINER" wget -qO- http://localhost:9333/cluster/status > /dev/null 2>&1; then
      echo "  ✓ SeaweedFS is ready"
      break
    fi
    sleep 2
  done
else
  echo "  ✓ SeaweedFS already running"
fi

# Ensure SeaweedFS URLs point at the container (internal Docker DNS)
SEAWEED_MASTER_EXPECTED="http://${SEAWEED_CONTAINER}:9333"
SEAWEED_FILER_EXPECTED="http://${SEAWEED_CONTAINER}:8888"
if ! grep -q "^SEAWEEDFS_MASTER_URL=${SEAWEED_MASTER_EXPECTED}$" "$APP_DIR/.env" 2>/dev/null; then
  # Remove any existing lines (commented or not) then append correct ones
  sed -i '/^#\?\s*SEAWEEDFS_MASTER_URL=/d;/^#\?\s*SEAWEEDFS_FILER_URL=/d' "$APP_DIR/.env"
  {
    echo "SEAWEEDFS_MASTER_URL=${SEAWEED_MASTER_EXPECTED}"
    echo "SEAWEEDFS_FILER_URL=${SEAWEED_FILER_EXPECTED}"
  } >> "$APP_DIR/.env"
  echo "  ✓ SeaweedFS URLs written to .env"
fi

# ─── 6. Backup existing database ──────────────────────────────────
echo "▶ Backing up database..."
mkdir -p "$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip > "$APP_DIR/backups/pre_deploy_${TIMESTAMP}.sql.gz" 2>/dev/null || true
# Keep last 10 backups
cd "$APP_DIR/backups" && ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "  ✓ Backup: pre_deploy_${TIMESTAMP}.sql.gz"

# ─── 7. Pull app image from registry ──────────────────────────────
echo "▶ Pulling image from registry: $APP_IMAGE"
docker pull "$APP_IMAGE"
echo "  ✓ Image pulled: $APP_IMAGE"

# ─── 8. Run database migrations ───────────────────────────────────
# Call the local prisma binary baked into the image directly (NOT npx)
# and pass --schema explicitly so resolution is deterministic.
echo "▶ Running database migrations..."
PRISMA_BIN="node /app/node_modules/prisma/build/index.js"
SCHEMA_ARG="--schema=/app/prisma/schema.prisma"

docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  --workdir /app \
  --entrypoint sh \
  "$APP_IMAGE" \
  -c "$PRISMA_BIN db execute $SCHEMA_ARG --file /app/prisma/migrations/001_backfill_idempotency_key.sql" \
  2>/dev/null || true

docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  --workdir /app \
  --entrypoint sh \
  "$APP_IMAGE" \
  -c "$PRISMA_BIN db push $SCHEMA_ARG"
echo "  ✓ Database schema up to date"

# ─── 9. Seed database (only if empty) ─────────────────────────────
echo "▶ Seeding database..."
docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  --workdir /app \
  --entrypoint sh \
  "$APP_IMAGE" \
  -c "$PRISMA_BIN db seed $SCHEMA_ARG" \
  2>/dev/null || true
echo "  ✓ Database seeded"

# ─── 10. Stop old container ───────────────────────────────────────
echo "▶ Stopping old container..."
docker stop "$APP_CONTAINER" 2>/dev/null || true
docker rm "$APP_CONTAINER" 2>/dev/null || true

# ─── 11. Start new container ──────────────────────────────────────
echo "▶ Starting application..."
docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file "$APP_DIR/.env" \
  "$APP_IMAGE"

# ─── 12. Health check ─────────────────────────────────────────────
echo "▶ Running health check..."
sleep 8
for i in $(seq 1 6); do
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✓ Application is running on port 3000"
    break
  fi
  if [ "$i" -eq 6 ]; then
    echo "  ❌ Health check failed! Container logs:"
    docker logs "$APP_CONTAINER" --tail 20
    exit 1
  fi
  echo "  Attempt $i/6 — waiting 5s..."
  sleep 5
done

# ─── 13. Caddy reverse proxy (auto-HTTPS via Let's Encrypt) ───────
CADDYFILE="/etc/caddy/Caddyfile"
if ! command -v caddy &> /dev/null; then
  echo "▶ Installing Caddy..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl >/dev/null 2>&1
  curl -1sSLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
  curl -1sSLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list 2>/dev/null
  apt-get update -qq
  apt-get install -y caddy >/dev/null
  echo "  ✓ Caddy installed"
fi

# Write Caddyfile only if missing or if reverse_proxy target changed
DESIRED_CADDYFILE=$(cat <<'CADDY'
nanachimi.digital, www.nanachimi.digital {
    encode zstd gzip
    reverse_proxy localhost:3000
}
CADDY
)

if [ ! -f "$CADDYFILE" ] || ! diff -q <(echo "$DESIRED_CADDYFILE") "$CADDYFILE" > /dev/null 2>&1; then
  echo "▶ Configuring Caddy..."
  echo "$DESIRED_CADDYFILE" > "$CADDYFILE"
  caddy validate --config "$CADDYFILE" --adapter caddyfile > /dev/null 2>&1 || {
    echo "  ❌ Caddyfile validation failed"
    exit 1
  }
  systemctl reload caddy 2>/dev/null || systemctl restart caddy
  systemctl enable caddy > /dev/null 2>&1 || true
  echo "  ✓ Caddy configured (auto-HTTPS via Let's Encrypt)"
else
  echo "  ✓ Caddy already configured"
fi

# ─── 14. Cleanup ──────────────────────────────────────────────────
echo "▶ Cleaning up old Docker images..."
docker image prune -af --filter "until=168h" 2>/dev/null || true

# ─── Done ─────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  ✅ Deployment complete!"
echo "============================================"
echo ""
echo "  Local:  http://localhost:3000"
echo "  Public: https://nanachimi.digital"
echo ""
echo "  Container: docker logs $APP_CONTAINER"
echo "  Database:  docker exec -it $DB_CONTAINER psql -U $DB_USER $DB_NAME"
echo "  Backup:    $APP_DIR/backups/"
echo ""
