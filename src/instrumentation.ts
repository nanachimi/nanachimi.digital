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
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Avoid double-registration in dev (hot reload)
  const g = globalThis as unknown as { __schedulerStarted?: boolean };
  if (g.__schedulerStarted) return;
  g.__schedulerStarted = true;

  const port = process.env.PORT || "3000";
  const base = `http://127.0.0.1:${port}`;

  console.log("[Scheduler] Background job scheduler started");

  // Process jobs every 60 seconds
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/process-jobs`);
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          console.log(`[Scheduler] Jobs: ${data.succeeded} ok, ${data.failed} failed`);
        }
      }
    } catch { /* server not ready */ }
  }, 60_000);

  // SLA check every 5 minutes
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/sla-check`);
      if (res.ok) {
        const data = await res.json();
        if (data.breached > 0) {
          console.log(`[Scheduler] SLA: ${data.breached} breached`);
        }
      }
    } catch { /* server not ready */ }
  }, 5 * 60_000);

  // Commission approval every 6 hours (14-day hold window — granularity not critical)
  setInterval(async () => {
    try {
      const res = await fetch(`${base}/api/cron/commissions-approve`);
      if (res.ok) {
        const data = await res.json();
        if (data.approved > 0) {
          console.log(`[Scheduler] Commissions: ${data.approved} approved`);
        }
      }
    } catch { /* server not ready */ }
  }, 6 * 60 * 60_000);

  // Initial run after 15s
  setTimeout(async () => {
    try {
      const res = await fetch(`${base}/api/cron/process-jobs`);
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          console.log(`[Scheduler] Initial: ${data.succeeded} ok, ${data.failed} failed`);
        }
      }
    } catch { /* expected on first startup */ }
  }, 15_000);
}
