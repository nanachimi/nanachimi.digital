#!/bin/bash
# ============================================================================
# nanachimi.digital — Dev Environment Deployment Script
# Deploys develop branch to https://dev.nanachimi.digital (port 3001)
# Usage: bash deploy-dev.sh
# ============================================================================

set -euo pipefail

APP_DIR="/opt/nanachimi-dev"
REPO_URL="https://github.com/nanachimi/nanachimi.digital.git"
NETWORK="nanachimi-network"
DB_CONTAINER="nanachimi-dev-db"
APP_CONTAINER="nanachimi-dev"
APP_PORT=3001
BRANCH="develop"
DOMAIN="dev.nanachimi.digital"

echo "============================================"
echo "  nanachimi.digital — Dev Deployment"
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
  # Adjust defaults for dev
  sed -i "s|postgresql://user:password@localhost:5432/nanachimi|postgresql://nanachimi:nanachimi_dev@${DB_CONTAINER}:5432/nanachimi_dev|" "$APP_DIR/.env"
  sed -i "s|https://nanachimi.digital|https://${DOMAIN}|" "$APP_DIR/.env"
  echo "  ⚠️  .env created from template — edit if needed: nano $APP_DIR/.env"
fi

# ─── Docker network ────────────────────────────────────────────────
docker network create "$NETWORK" 2>/dev/null || true

# ─── Dev PostgreSQL ────────────────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "▶ Starting dev PostgreSQL..."
  docker run -d \
    --name "$DB_CONTAINER" \
    --network "$NETWORK" \
    --restart unless-stopped \
    -e POSTGRES_USER=nanachimi \
    -e POSTGRES_PASSWORD=nanachimi_dev \
    -e POSTGRES_DB=nanachimi_dev \
    -v nanachimi-dev-pgdata:/var/lib/postgresql/data \
    postgres:16-alpine

  sleep 5
  echo "  ✓ Dev PostgreSQL started"
else
  echo "  ✓ Dev PostgreSQL already running"
fi

# ─── Build ─────────────────────────────────────────────────────────
echo "▶ Building Docker image..."
cd "$APP_DIR"
docker build -t nanachimi-digital:dev . --quiet
echo "  ✓ Image built: nanachimi-digital:dev"

# ─── Migrate + Seed ───────────────────────────────────────────────
echo "▶ Running migrations..."
docker run --rm --network "$NETWORK" --env-file "$APP_DIR/.env" \
  nanachimi-digital:dev npx prisma db push
docker run --rm --network "$NETWORK" --env-file "$APP_DIR/.env" \
  nanachimi-digital:dev npx prisma db seed 2>/dev/null || true
echo "  ✓ Database ready"

# ─── Deploy ───────────────────────────────────────────────────────
echo "▶ Deploying dev..."
docker stop "$APP_CONTAINER" 2>/dev/null || true
docker rm "$APP_CONTAINER" 2>/dev/null || true

docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p ${APP_PORT}:3000 \
  --env-file "$APP_DIR/.env" \
  nanachimi-digital:dev

# ─── Health check ─────────────────────────────────────────────────
echo "▶ Health check..."
sleep 8
for i in $(seq 1 6); do
  if curl -sf http://localhost:${APP_PORT} > /dev/null 2>&1; then
    echo "  ✓ Dev is running on port ${APP_PORT}"
    break
  fi
  [ "$i" -eq 6 ] && { echo "❌ Failed!"; docker logs "$APP_CONTAINER" --tail 20; exit 1; }
  sleep 5
done

# ─── Nginx for dev subdomain ──────────────────────────────────────
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
echo "  ✅ Dev deployment complete!"
echo "============================================"
echo "  Local:  http://localhost:${APP_PORT}"
echo "  Public: https://$DOMAIN"
echo ""
