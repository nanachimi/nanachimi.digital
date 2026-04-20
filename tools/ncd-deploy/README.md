# ncd-deploy — Customer Demo Deployment Tool

Deploy any customer app from your local PC to the Hetzner demo VPS, making it available at `<project>.nanachimi.dev` with automatic HTTPS.

## Workspace Layout

Your workspace is expected to look like this:

```
C:\Workspace\
├── blockchainwood\       ← customer project
├── cerebra\              ← customer project
├── credilis\             ← customer project
├── djanggi\              ← customer project
├── kabelmarkt24\         ← customer project
├── kossimmo\             ← customer project
├── kumlix\               ← customer project
├── losmach\              ← customer project
├── makkala\              ← customer project
├── movovia\              ← customer project
├── nanachimi.digital\    ← contains ncd-deploy tool
└── trendsnag\            ← customer project
```

---

## One-Time Setup

### 1. Add `ncd-deploy` to your PATH

Open Git Bash and run:

```bash
echo 'export PATH="$PATH:/c/Workspace/nanachimi.digital/tools/ncd-deploy"' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
ncd-deploy help
```

### 2. Create the VPS config file

```bash
cat > ~/.ncd-deploy.conf << 'EOF'
DEMO_HOST=<YOUR-HETZNER-IP>
DEMO_USER=root
SSH_KEY=~/.ssh/id_ed25519
EOF
```

Replace `<YOUR-HETZNER-IP>` with your demo VPS IP. Adjust `SSH_KEY` if yours is different (e.g. `~/.ssh/id_rsa`).

### 3. Add DNS on Namecheap

Log into Namecheap → `nanachimi.dev` → Advanced DNS → Add:

| Type     | Host | Value                | TTL       |
| -------- | ---- | -------------------- | --------- |
| A Record | `*`  | `<YOUR-HETZNER-IP>`  | Automatic |
| A Record | `@`  | `<YOUR-HETZNER-IP>`  | Automatic |

Wait 5–15 min for DNS to propagate. Verify:

```bash
nslookup test.nanachimi.dev
```

### 4. Bootstrap the VPS

```bash
ncd-deploy setup
```

This installs Docker + Caddy on your VPS and creates the required directories.

---

## Daily Workflow — Deploying a Customer Project

Since `ncd-deploy` is on your PATH, you can run it from **any directory**. Just `cd` into the project you want to deploy.

### Deploy `kabelmarkt24`

```bash
cd /c/Workspace/kabelmarkt24
ncd-deploy deploy kabelmarkt24
```

→ Live at **https://kabelmarkt24.nanachimi.dev**

### Deploy `blockchainwood` with a database

```bash
cd /c/Workspace/blockchainwood
ncd-deploy deploy blockchainwood --db
```

→ Live at **https://blockchainwood.nanachimi.dev** with PostgreSQL

### Deploy `kossimmo` with custom env vars

```bash
cd /c/Workspace/kossimmo
ncd-deploy deploy kossimmo --env .env.production
```

### Deploy with a specific password

```bash
cd /c/Workspace/blockchainwood
ncd-deploy deploy blockchainwood --password 'ClientDemo2026!'
```

### Deploy a public demo (no password)

```bash
cd /c/Workspace/trendsnag
ncd-deploy deploy trendsnag --no-auth
```

### Deploy without `cd` (using relative path)

From `C:\Workspace`:

```bash
cd /c/Workspace
ncd-deploy deploy cerebra --path ./cerebra
ncd-deploy deploy djanggi --path ./djanggi
```

---

## Batch Deploy All Projects at Once

From `C:\Workspace`:

```bash
cd /c/Workspace
for project in blockchainwood cerebra credilis djanggi kabelmarkt24 kossimmo kumlix losmach makkala movovia trendsnag; do
  echo "=== Deploying $project ==="
  ncd-deploy deploy "$project" --path "./$project"
done
```

---

## Managing Deployed Projects

```bash
# See everything you've deployed
ncd-deploy list

# Check specific project
ncd-deploy status kabelmarkt24

# Watch logs
ncd-deploy logs kabelmarkt24

# Tear it down when the demo is over
ncd-deploy remove kabelmarkt24
```

## Managing Authentication

Every demo is password-protected by default. On first deploy, a random password is auto-generated and shown **once**. To change credentials after deploy:

```bash
# Rotate to a new random password
ncd-deploy auth kabelmarkt24 --rotate

# Set a specific password
ncd-deploy auth kabelmarkt24 --password 'NewClientPass2026!'

# Change the username
ncd-deploy auth kabelmarkt24 --user client-acme --password 'NewPass!'

# Remove auth (make public)
ncd-deploy auth kabelmarkt24 --disable

# Show current user (password stays hidden)
ncd-deploy auth kabelmarkt24 --show
```

**Important:** Passwords are only displayed at the moment they're set. The VPS only stores the bcrypt hash. If a customer loses their password, rotate it.

---

## What the Tool Does Automatically

When you run `ncd-deploy deploy kabelmarkt24` inside `C:\Workspace\kabelmarkt24`:

1. Looks for a `Dockerfile` in that folder
2. If missing, auto-detects the project type:
   - Has `package.json` with `next` → uses Next.js template
   - Has `package.json` without next → Node.js template
   - Has `requirements.txt` / `pyproject.toml` → Python template
   - Has `index.html` → static site template
3. Builds the image locally: `ncd-demo-kabelmarkt24`
4. Ships it to your VPS via SSH (gzipped)
5. Picks a free port (4000–4999)
6. Starts the container on the VPS
7. Configures Caddy for `kabelmarkt24.nanachimi.dev`
8. Caddy auto-fetches a Let's Encrypt cert
9. Prints the live URL

Total time: usually 30–90 seconds per deploy (after first build).

---

## Per-Project `.env` Files

If each customer project has its own `.env` with secrets, the tool picks it up automatically:

```
C:\Workspace\kabelmarkt24\
├── Dockerfile          ← optional, auto-generated if missing
├── .env                ← auto-uploaded to VPS
└── src\...
```

Just run `ncd-deploy deploy kabelmarkt24` from inside that folder — no `--env` flag needed.

---

## Command Reference

| Command                              | Description                              |
| ------------------------------------ | ---------------------------------------- |
| `ncd-deploy setup`                   | Bootstrap the demo VPS (one-time)        |
| `ncd-deploy deploy <name> [OPTIONS]` | Deploy a project                         |
| `ncd-deploy auth <name> [OPTIONS]`   | Manage basic auth on a deployed project  |
| `ncd-deploy list`                    | List all deployed projects               |
| `ncd-deploy status <name>`           | Show detailed project status             |
| `ncd-deploy logs <name>`             | Stream container logs                    |
| `ncd-deploy remove <name>`           | Stop container, remove config, clean up  |
| `ncd-deploy help`                    | Show full help                           |

### Deploy Options

| Option                 | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `--path PATH`          | Project directory (default: current directory)           |
| `--env FILE`           | `.env` file to upload (default: `./.env` if exists)      |
| `--port PORT`          | Override auto-assigned host port                         |
| `--internal-port PORT` | Container port (default: parsed from Dockerfile EXPOSE)  |
| `--db`                 | Provision a PostgreSQL database for the project          |
| `--build-arg KEY=VAL`  | Docker build argument (repeatable)                       |
| `--password PASS`      | Set basic-auth password (default: auto-generate on first deploy) |
| `--user USER`          | Basic-auth username (default: `demo`)                    |
| `--no-auth`            | Deploy without password protection                       |

### Auth Options

| Option             | Description                                |
| ------------------ | ------------------------------------------ |
| `--password PASS`  | Set a new password                         |
| `--user USER`      | Change username (default: keep existing)   |
| `--rotate`         | Generate a new random password             |
| `--disable`        | Remove basic auth (make public)            |
| `--show`           | Show current auth state (user only)        |
