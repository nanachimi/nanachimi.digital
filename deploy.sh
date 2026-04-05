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
  git reset --hard origin/master
else
  echo "▶ Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  git checkout master
fi

# ─── 3. Check .env ────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠️  No .env file found!"
  echo "   Creating from .env.example — you MUST edit it with real values:"
  echo ""
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Required: DATABASE_URL, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD"
  echo "   Then re-run: bash deploy.sh"
  exit 1
fi

echo "  ✓ .env file exists"

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
echo "▶ Building Docker image (this may take a few minutes)..."
cd "$APP_DIR"
docker build -t nanachimi-digital-prod:latest . --quiet
echo "  ✓ Image built: nanachimi-digital-prod:latest"

# ─── 8. Run database migrations ───────────────────────────────────
echo "▶ Running database migrations..."
docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  nanachimi-digital-prod:latest \
  npx prisma db execute --file prisma/migrations/001_backfill_idempotency_key.sql 2>/dev/null || true
docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  nanachimi-digital-prod:latest \
  npx prisma db push
echo "  ✓ Database schema up to date"

# ─── 9. Seed database (only if empty) ─────────────────────────────
echo "▶ Seeding database..."
docker run --rm \
  --network "$NETWORK" \
  --env-file "$APP_DIR/.env" \
  nanachimi-digital-prod:latest \
  npx prisma db seed 2>/dev/null || true
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

# ─── 13. Nginx reverse proxy check ────────────────────────────────
if command -v nginx &> /dev/null; then
  if [ ! -f /etc/nginx/sites-available/nanachimi.digital ]; then
    echo ""
    echo "▶ Setting up Nginx reverse proxy..."
    cat > /etc/nginx/sites-available/nanachimi.digital <<'NGINX'
server {
    listen 80;
    server_name nanachimi.digital www.nanachimi.digital;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
    ln -sf /etc/nginx/sites-available/nanachimi.digital /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "  ✓ Nginx configured"

    # SSL with Certbot
    if command -v certbot &> /dev/null; then
      echo "▶ Setting up SSL certificate..."
      certbot --nginx -d nanachimi.digital -d www.nanachimi.digital --non-interactive --agree-tos --email info@nanachimi.digital 2>/dev/null || true
      echo "  ✓ SSL configured"
    else
      echo "  ⚠️  Install certbot for HTTPS: apt install certbot python3-certbot-nginx"
    fi
  else
    echo "  ✓ Nginx already configured"
  fi
else
  echo ""
  echo "  ⚠️  Nginx not installed. Install it for HTTPS:"
  echo "     apt install nginx certbot python3-certbot-nginx"
  echo "     Then re-run: bash deploy.sh"
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
