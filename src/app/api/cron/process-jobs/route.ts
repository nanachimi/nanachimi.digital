import { NextResponse } from "next/server";
import { processJobs } from "@/lib/job-queue";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/process-jobs
 * Internal endpoint — processes pending jobs from the queue.
 * Called automatically by the background scheduler (instrumentation.ts).
 * Protected by middleware (same as /api/admin routes).
 */
export async function GET() {
  const result = await processJobs();

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
