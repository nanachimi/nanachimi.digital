# nanachimi.digital

Web- und Mobile-Lösungen für Kleingewerbe und Gründer — von der Idee bis zum laufenden Betrieb.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| File Storage | SeaweedFS |
| Payments | Stripe |
| AI | Anthropic Claude API |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI/CD | GitHub Actions (self-hosted runner) |
| Hosting | Hetzner VPS + Docker |

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Docker (for SeaweedFS, MailHog)

### Setup

```bash
# 1. Clone
git clone git@github.com:nanachimi/nanachimi.digital.git
cd nanachimi.digital

# 2. Install dependencies
npm install

# 3. Environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Seed default data (pricing config, availability slots)
npx prisma db seed

# 7. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional Services (Docker)

```bash
# MailHog (email testing — captures all outgoing mail)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
# Web UI: http://localhost:8025

# SeaweedFS (file storage for PDFs and uploads)
docker run -d --name seaweedfs -p 9333:9333 -p 8080:8080 -p 8888:8888 \
  chrislusf/seaweedfs server -master -volume -filer
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for AI plan generation |
| `ADMIN_USERNAME` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `SESSION_SECRET` | ✅ | 32+ char secret (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public URL of the site |
| `EMAIL_FROM` | ✅ | Sender email address |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_PORT` | ✅ | SMTP server port |
| `STRIPE_SECRET_KEY` | ❌ | Stripe API key (payments disabled without it) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook verification secret |
| `HEALTH_CHECK_SECRET` | ❌ | Bearer token for `/api/health` in CI |
| `SEAWEEDFS_MASTER_URL` | ❌ | SeaweedFS master URL |
| `SEAWEEDFS_FILER_URL` | ❌ | SeaweedFS filer URL |

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run test:unit        # Vitest unit tests
npm run test:integration # Vitest integration tests (requires running server)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # Playwright with browser visible
npm run test:e2e:ui      # Playwright UI mode
```

## Project Structure

```
nanachimi.digital/
├── .github/workflows/    # CI/CD pipeline
├── e2e/                  # Playwright E2E tests
│   └── helpers/          # Test utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Default data seeder
│   └── migrations/       # Migration history
├── prisma.config.ts      # Prisma 7 config (seed, datasource)
├── src/
│   ├── app/
│   │   ├── (admin)/      # Admin backoffice (protected)
│   │   ├── (public)/     # Public pages
│   │   ├── api/          # API routes
│   │   └── layout.tsx    # Root layout
│   ├── components/
│   │   ├── admin/        # Admin components
│   │   ├── onboarding/   # Onboarding form steps
│   │   ├── sections/     # Landing page sections
│   │   └── ui/           # shadcn/ui components
│   ├── data/             # Static data (services, portfolio, hero variants)
│   └── lib/              # Business logic
│       ├── ab-tests.ts   # A/B testing engine
│       ├── analytics.ts  # Analytics tracking
│       ├── angebote.ts   # Angebot CRUD
│       ├── bookings.ts   # Availability & booking
│       ├── db.ts         # Prisma client singleton
│       ├── email.ts      # Transactional emails
│       ├── estimation.ts # Pricing engine
│       └── submissions.ts # Submission CRUD
├── tests/
│   ├── unit/             # Vitest unit tests
│   └── integration/      # Vitest integration tests
├── playwright.config.ts  # Playwright config
└── vitest.config.ts      # Vitest config
```

## CI/CD Pipeline

Self-hosted GitHub Actions runner on Hetzner VPS. No GitHub-hosted storage, cache, or registry.

### Pipeline Stages

```
push to develop  ──→  Lint + TypeCheck + Build  ──→  E2E Tests  ──→  Docker Build  ──→  Deploy Dev
push to staging  ──→  Lint + TypeCheck + Build  ──→  E2E Tests  ──→  Docker Build  ──→  Deploy Staging
push to master   ──→  Lint + TypeCheck + Build  ──→  E2E Tests  ──→  Docker Build  ──→  Deploy Production
pull_request     ──→  Lint + TypeCheck + Build  (quality gate only, no deploy)
```

### Infrastructure

| Component | Host | Purpose |
|-----------|------|---------|
| CI Runner | `128.140.33.184` | Builds, tests, pushes images |
| Docker Registry | `128.140.33.184:5000` | Self-hosted image registry |
| Dev + Staging | `162.55.182.34` | Non-production deployments |
| Production | TBD | Production deployment |

### Deployment Map

| Environment | Branch | Container | Port | URL |
|-------------|--------|-----------|------|-----|
| Dev | `develop` | `nanachimi-dev` | 3001 | https://dev.nanachimi.digital |
| Staging | `staging` | `nanachimi-staging` | 3002 | https://staging.nanachimi.digital |
| Production | `master` | `nanachimi-app` | 3000 | https://nanachimi.digital |

Dev and staging are password-protected (nginx `auth_basic`).

### Deploy Architecture

Deploys are **self-bootstrapping** — on first deploy to a fresh server, the pipeline automatically:

1. Creates `nanachimidigital-network` Docker network
2. Starts a PostgreSQL 16 container with auto-generated password
3. Generates `.env` from GitHub secrets
4. Pulls image from self-hosted registry
5. Runs Prisma migrations (`prisma db push`)
6. Starts the application container
7. Runs health check smoke test

No manual server setup required beyond Docker and SSH access.

### Required GitHub Configuration

#### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value | Description |
|----------|-------|-------------|
| `NONPROD_HOST` | `162.55.182.34` | Dev/staging server IP |
| `NONPROD_USER` | `deploy` | SSH user with Docker access |
| `REGISTRY_HOST` | `128.140.33.184:5000` | CI runner registry address |
| `PROD_HOST` | TBD | Production server IP |
| `PROD_USER` | TBD | Production SSH user |

#### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | How to generate | Used by |
|--------|----------------|---------|
| `NONPROD_SSH_KEY` | `cat ~/.ssh/id_ed25519` (passphrase-free) | Dev + Staging deploy |
| `DEV_ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) | Dev |
| `DEV_ADMIN_PASSWORD` | Choose a strong password | Dev admin login |
| `DEV_SESSION_SECRET` | `openssl rand -hex 32` | Dev session signing |
| `DEV_STRIPE_SECRET_KEY` | From [dashboard.stripe.com](https://dashboard.stripe.com) (test key) | Dev payments |
| `STAGING_ANTHROPIC_API_KEY` | Same or separate key | Staging |
| `STAGING_ADMIN_PASSWORD` | Choose a strong password | Staging admin login |
| `STAGING_SESSION_SECRET` | `openssl rand -hex 32` | Staging session signing |
| `STAGING_STRIPE_SECRET_KEY` | From Stripe (test key) | Staging payments |
| `PROD_SSH_KEY` | TBD | Production deploy |
| `DATABASE_URL` | TBD | Production database |
| `HEALTH_CHECK_SECRET` | `openssl rand -hex 32` | Production health check |

### Self-Hosted Runner Setup

```bash
# On CI runner machine (128.140.33.184)
mkdir -p /opt/nanachimidigital-runner && cd /opt/nanachimidigital-runner
curl -o actions-runner-linux-x64-2.322.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz
tar xzf actions-runner-linux-x64-2.322.0.tar.gz

# Get token from: https://github.com/nanachimi/nanachimi.digital/settings/actions/runners/new
./config.sh --url https://github.com/nanachimi/nanachimi.digital --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

Docker registry (on CI runner):

```bash
docker run -d --name registry --restart unless-stopped -p 5000:5000 registry:2
```

Insecure registry config on **both** CI runner and deploy server (`/etc/docker/daemon.json`):

```json
{
  "insecure-registries": ["128.140.33.184:5000", "localhost:5000"]
}
```

Restart Docker after editing: `sudo systemctl restart docker`

### Nginx Reverse Proxy (on deploy server)

```nginx
# /etc/nginx/sites-available/dev.nanachimi.digital
server {
    listen 80;
    server_name dev.nanachimi.digital;

    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL: `sudo certbot --nginx -d dev.nanachimi.digital`

Password: `sudo htpasswd -c /etc/nginx/.htpasswd nanachimi`

### DNS Records

| Type | Name | Value |
|------|------|-------|
| A | `dev` | `162.55.182.34` |
| A | `staging` | `162.55.182.34` |
| A | `@` | TBD (production server IP) |

## Key Features

- **AI Onboarding** — 12-step guided flow with instant estimate
- **Auto-Estimation** — Risk-adjusted pricing engine with demand factor
- **A/B Testing** — Deterministic variant assignment per visitor
- **Angebot System** — AI-generated project plans, PDF export, accept/reject flow
- **Stripe Payments** — 3 payment tiers with early-pay discounts
- **Analytics** — Page views, onboarding funnel, conversion tracking with IP exclusion
- **Admin Backoffice** — Submission management, amendment workflow, analytics dashboard
- **Job Queue** — Email retry with exponential backoff (1m → 3m → 10m → 30m → 60m)

## License

Proprietary. All rights reserved.
