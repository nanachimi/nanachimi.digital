import { NextResponse } from "next/server";
import { processJobs } from "@/lib/job-queue";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/process-jobs
 * Processes pending jobs from the queue. Call via external cron (e.g. every minute).
 * Protected by HEALTH_CHECK_SECRET or admin session.
 */
export async function GET(request: Request) {
  // Auth: bearer token or admin session
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.replace("Bearer ", "");
  const secret = process.env.HEALTH_CHECK_SECRET;

  if (!secret || bearerToken !== secret) {
    try {
      const { requireAdmin } = await import("@/lib/auth/require-admin");
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processJobs();

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
