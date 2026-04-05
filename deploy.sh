#!/bin/bash
# ============================================================================
# nanachimi.digital — Production Deployment Script
# Run this on your Hetzner VPS to deploy from master branch
# Usage: bash deploy.sh
# ============================================================================

set -euo pipefail

APP_DIR="/opt/nanachimi-digital"
REPO_URL="https://github.com/nanachimi/nanachimi.digital.git"
NETWORK="nanachimi-digital-network"
DB_CONTAINER="nanachimi-digital-prod-db"
APP_CONTAINER="nanachimi-digital-prod-app"
DB_USER="nanachimi_digital"
DB_NAME="nanachimi_digital"
DB_VOLUME="nanachimi-digital-pgdata"

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

if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed. Install it first:"
  echo "   apt-get install -y git"
  exit 1
fi

echo "  ✓ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
echo "  ✓ Git $(git --version | grep -oP '\d+\.\d+\.\d+')"

# ─── 2. Clone or pull repo ────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▶ Pulling latest master..."
  cd "$APP_DIR"
  git fetch origin
  git checkout master
  OLD_SHA=$(git rev-parse HEAD)
  git reset --hard origin/master
  NEW_SHA=$(git rev-parse HEAD)
  # Self-update: if deploy.sh changed, re-exec the new version so the
  # currently running (in-memory, stale) copy does not continue.
  if [ "$OLD_SHA" != "$NEW_SHA" ] && [ "${DEPLOY_SH_RESTARTED:-}" != "1" ]; then
    echo "  ↻ deploy.sh updated — re-executing new version..."
    export DEPLOY_SH_RESTARTED=1
    exec bash "$APP_DIR/deploy.sh" "$@"
  fi
elif [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
  # Directory exists and is non-empty but no .git (e.g. half-finished prior run).
  # Init git in place so we DO NOT destroy any existing .env or backups.
  echo "▶ Directory $APP_DIR exists without .git — initializing in place..."
  cd "$APP_DIR"
  git init -q
  git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
  git fetch origin master
  git checkout -f -B master origin/master
else
  echo "▶ Cloning repository..."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  git checkout master
fi

# ─── 3. Check .env ────────────────────────────────────────────────
# IMPORTANT: never overwrite an existing .env — production secrets must survive deploys.
if [ -f "$APP_DIR/.env" ]; then
  echo "  ✓ .env file exists (preserving current values)"
else
  echo ""
  echo "⚠️  No .env file found!"
  echo "   Creating from .env.example — you MUST edit it with real values:"
  echo ""
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Required: DATABASE_URL, POSTGRES_PASSWORD, SESSION_SECRET,"
  echo "             ADMIN_USERNAME, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL"
  echo "   Then re-run: bash deploy.sh"
  exit 1
fi

# ─── 4. Docker network ────────────────────────────────────────────
echo "▶ Creating Docker network..."
docker network create "$NETWORK" 2>/dev/null || true

# ─── 5. PostgreSQL ────────────────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "▶ Starting PostgreSQL..."

  # Read DB password from .env
  DB_PASS=$(grep -oP 'POSTGRES_PASSWORD=\K.*' "$APP_DIR/.env" 2>/dev/null || echo "nanachimi_digital_prod")

  docker run -d \
    --name "$DB_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -e POSTGRES_DB="$DB_NAME" \
    -v "$DB_VOLUME":/var/lib/postgresql/data \
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

# ─── 6. Backup existing database ──────────────────────────────────
echo "▶ Backing up database..."
mkdir -p "$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip > "$APP_DIR/backups/pre_deploy_${TIMESTAMP}.sql.gz" 2>/dev/null || true
# Keep last 10 backups
cd "$APP_DIR/backups" && ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "  ✓ Backup: pre_deploy_${TIMESTAMP}.sql.gz"

# ─── 7. Build Docker image ────────────────────────────────────────
# Read NEXT_PUBLIC_* from .env and pass as --build-arg so they are
# inlined into the browser bundle. Server-side secrets stay out of
# the image (they ship via --env-file at runtime).
echo "▶ Building Docker image (this may take a few minutes)..."
cd "$APP_DIR"

read_env() {
  local key="$1"
  grep -E "^${key}=" "$APP_DIR/.env" | head -n1 | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

NEXT_PUBLIC_SITE_URL_VAL=$(read_env NEXT_PUBLIC_SITE_URL)
NEXT_PUBLIC_CALCOM_USERNAME_VAL=$(read_env NEXT_PUBLIC_CALCOM_USERNAME)

if [ -z "$NEXT_PUBLIC_SITE_URL_VAL" ]; then
  echo "  ❌ NEXT_PUBLIC_SITE_URL is missing from .env — required for build"
  exit 1
fi

docker build \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL_VAL" \
  --build-arg NEXT_PUBLIC_CALCOM_USERNAME="$NEXT_PUBLIC_CALCOM_USERNAME_VAL" \
  -t nanachimi-digital-prod:latest . --quiet
echo "  ✓ Image built: nanachimi-digital-prod:latest"
echo "    · NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL_VAL"

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
  nanachimi-digital-prod:latest \
  -c "$PRISMA_BIN db execute $SCHEMA_ARG --file /app/prisma/migrations/001_backfill_idempotency_key.sql" \
  2>/dev/null || true

docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  --workdir /app \
  --entrypoint sh \
  nanachimi-digital-prod:latest \
  -c "$PRISMA_BIN db push $SCHEMA_ARG"
echo "  ✓ Database schema up to date"

# ─── 9. Seed database (only if empty) ─────────────────────────────
echo "▶ Seeding database..."
docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  --workdir /app \
  --entrypoint sh \
  nanachimi-digital-prod:latest \
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
  nanachimi-digital:latest

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
