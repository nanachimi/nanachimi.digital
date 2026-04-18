/**
 * Next.js Instrumentation — runs once when the server starts.
 *
 * Starts background intervals for:
 *   - Job queue processing (every 60s)
 *   - SLA breach checking (every 5min)
 *   - Commission approval (every 6h — 14d hold window)
 *
 * Calls internal /api/cron/* endpoints via localhost.
 * Middleware allows localhost-only access to these routes.
 */
import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // ─── Startup env validation ──────────────────────────────────────
  const requiredSecrets = ["SESSION_SECRET", "AFFILIATE_SESSION_SECRET"] as const;
  for (const name of requiredSecrets) {
    const val = process.env[name];
    if (!val || val.length < 32) {
      throw new Error(
        `[Startup] ${name} is missing or too short (min 32 chars). Refusing to start.`,
      );
    }
  }

  // Avoid double-registration in dev (hot reload)
  const g = globalThis as unknown as { __schedulerStarted?: boolean };
  if (g.__schedulerStarted) return;
  g.__schedulerStarted = true;

  const port = process.env.PORT || "3000";
  const base = `http://127.0.0.1:${port}`;
  const cronHeaders: HeadersInit = process.env.CRON_SECRET
    ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
    : {};

  logger.info({ tag: "Scheduler" }, "Background job scheduler started");

  // Process jobs every 60 seconds
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/process-jobs`, { headers: cronHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          logger.info({ tag: "Scheduler", succeeded: data.succeeded, failed: data.failed }, "Jobs processed");
        }
      }
    } catch { /* server not ready */ }
  }, 60_000);

  // SLA check every 5 minutes
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/sla-check`, { headers: cronHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.breached > 0) {
          logger.warn({ tag: "Scheduler", breached: data.breached }, "SLA breaches detected");
        }
      }
    } catch { /* server not ready */ }
  }, 5 * 60_000);

  // Commission approval every 6 hours (14-day hold window ��� granularity not critical)
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/commissions-approve`, { headers: cronHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.approved > 0) {
          logger.info({ tag: "Scheduler", approved: data.approved }, "Commissions approved");
        }
      }
    } catch { /* server not ready */ }
  }, 6 * 60 * 60_000);

  // Orphaned file cleanup every 6 hours
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/cleanup-files`, { headers: cronHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.cleaned > 0) {
          logger.info({ tag: "Scheduler", cleaned: data.cleaned }, "Orphaned files cleaned");
        }
      }
    } catch { /* server not ready */ }
  }, 6 * 60 * 60_000);

  // Initial run after 15s
  setTimeout(async () => {
    try {
      const res = await fetch(`${base}/api/cron/process-jobs`, { headers: cronHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          logger.info({ tag: "Scheduler", succeeded: data.succeeded, failed: data.failed }, "Initial job run");
        }
      }
    } catch { /* expected on first startup */ }
  }, 15_000);
}
