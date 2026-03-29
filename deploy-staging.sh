#!/bin/bash
# ============================================================================
# nanachimi.digital — Staging Environment Deployment Script
# Deploys staging branch to https://staging.nanachimi.digital (port 3002)
# Usage: bash deploy-staging.sh
# ============================================================================

set -euo pipefail

APP_DIR="/opt/nanachimi-staging"
REPO_URL="https://github.com/nanachimi/nanachimi.digital.git"
NETWORK="nanachimi-network"
DB_CONTAINER="nanachimi-staging-db"
APP_CONTAINER="nanachimi-staging"
APP_PORT=3002
BRANCH="staging"
DOMAIN="staging.nanachimi.digital"

echo "============================================"
echo "  nanachimi.digital — Staging Deployment"
echo "  Branch: $BRANCH → $DOMAIN"
echo "============================================"
echo ""

# ─── Prerequisites ─────────────────────────────────────────────────
echo "▶ Checking prerequisites..."
command -v docker &> /dev/null || { echo "❌ Docker not installed"; exit 1; }
command -v git &> /dev/null || { echo "❌ Git not installed"; exit 1; }
echo "  ✓ Docker + Git installed"

# ─── Clone or pull ─────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▶ Pulling latest $BRANCH..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "▶ Cloning repository ($BRANCH)..."
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── Check .env ────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  sed -i "s|postgresql://user:password@localhost:5432/nanachimi|postgresql://nanachimi:nanachimi_staging@${DB_CONTAINER}:5432/nanachimi_staging|" "$APP_DIR/.env"
  sed -i "s|https://nanachimi.digital|https://${DOMAIN}|" "$APP_DIR/.env"
  echo "  ⚠️  .env created from template — edit if needed: nano $APP_DIR/.env"
fi

# ─── Docker network ────────────────────────────────────────────────
docker network create "$NETWORK" 2>/dev/null || true

# ─── Staging PostgreSQL ────────────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "▶ Starting staging PostgreSQL..."
  docker run -d \
    --name "$DB_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -e POSTGRES_USER=nanachimi \
    -e POSTGRES_PASSWORD=nanachimi_staging \
    -e POSTGRES_DB=nanachimi_staging \
    -v nanachimi-staging-pgdata:/var/lib/postgresql/data \
    postgres:16-alpine

  sleep 5
  echo "  ✓ Staging PostgreSQL started"
else
  echo "  ✓ Staging PostgreSQL already running"
fi

# ─── Backup ───────────────────────────────────────────────────────
echo "▶ Backing up staging database..."
mkdir -p "$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec "$DB_CONTAINER" pg_dump -U nanachimi nanachimi_staging \
  | gzip > "$APP_DIR/backups/pre_deploy_${TIMESTAMP}.sql.gz" 2>/dev/null || true
cd "$APP_DIR/backups" && ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

# ─── Build ─────────────────────────────────────────────────────────
echo "▶ Building Docker image..."
cd "$APP_DIR"
docker build -t nanachimi-digital:staging . --quiet
echo "  ✓ Image built: nanachimi-digital:staging"

# ─── Migrate + Seed ───────────────────────────────────────────────
echo "▶ Running migrations..."
docker run --rm --network "$NETWORK" --env-file "$APP_DIR/.env" \
  nanachimi-digital:staging npx prisma db push
docker run --rm --network "$NETWORK" --env-file "$APP_DIR/.env" \
  nanachimi-digital:staging npx prisma db seed 2>/dev/null || true
echo "  ✓ Database ready"

# ─── Deploy ───────────────────────────────────────────────────────
echo "▶ Deploying staging..."
docker stop "$APP_CONTAINER" 2>/dev/null || true
docker rm "$APP_CONTAINER" 2>/dev/null || true

docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p ${APP_PORT}:3000 \
  --env-file "$APP_DIR/.env" \
  nanachimi-digital:staging

# ─── Health check ─────────────────────────────────────────────────
echo "▶ Health check..."
sleep 8
for i in $(seq 1 6); do
  if curl -sf http://localhost:${APP_PORT} > /dev/null 2>&1; then
    echo "  ✓ Staging is running on port ${APP_PORT}"
    break
  fi
  [ "$i" -eq 6 ] && { echo "❌ Failed!"; docker logs "$APP_CONTAINER" --tail 20; exit 1; }
  sleep 5
done

# ─── Nginx ────────────────────────────────────────────────────────
if command -v nginx &> /dev/null && [ ! -f /etc/nginx/sites-available/$DOMAIN ]; then
  echo "▶ Setting up Nginx for $DOMAIN..."
  cat > /etc/nginx/sites-available/$DOMAIN <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "  ✓ Nginx configured for $DOMAIN"

  if command -v certbot &> /dev/null; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email info@nanachimi.digital 2>/dev/null || true
    echo "  ✓ SSL configured"
  fi
fi

# ─── Cleanup ──────────────────────────────────────────────────────
docker image prune -af --filter "until=48h" 2>/dev/null || true

echo ""
echo "============================================"
echo "  ✅ Staging deployment complete!"
echo "============================================"
echo "  Local:  http://localhost:${APP_PORT}"
echo "  Public: https://$DOMAIN"
echo ""
