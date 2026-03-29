import { NextResponse } from "next/server";
import {
  getBreachedSlaSubmissions,
  updateSubmissionStatus,
} from "@/lib/submissions";
import { generateAutoAngebot } from "@/lib/auto-angebot";

/**
 * GET /api/cron/sla-check — SLA enforcement cron job.
 *
 * Should be called every 5 minutes via an external cron service
 * (e.g., GitHub Actions, Hetzner cron, or Vercel Cron).
 *
 * Checks for submissions in "sla_active" status where slaDeadline < now.
 * For each breached submission:
 *   1. Update status to "sla_breached"
 *   2. Attempt auto-Angebot generation
 *   3. If successful → "auto_generated" → "angebot_sent"
 *   4. If failed → stays "sla_breached" (admin must handle manually)
 *
 * Protected by CRON_SECRET env var.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const breached = await getBreachedSlaSubmissions();

  if (breached.length === 0) {
    return NextResponse.json({ checked: true, breached: 0 });
  }

  const results: { id: string; status: string; reason?: string }[] = [];

  for (const submission of breached) {
    // 1. Mark as breached
    await updateSubmissionStatus(submission.id, "sla_breached");

    // 2. Skip auto-generation if customer chose "call"
    if (submission.naechsterSchritt === "call") {
      results.push({
        id: submission.id,
        status: "sla_breached",
        reason: "Call path — no auto-Angebot",
      });
      continue;
    }

    // 3. Attempt auto-generation
    const result = await generateAutoAngebot(submission);

    if (result.success) {
      results.push({
        id: submission.id,
        status: "angebot_sent",
        reason: `Auto-Angebot ${result.angebotId} generated`,
      });
    } else {
      // Stays sla_breached — admin must handle
      results.push({
        id: submission.id,
        status: "sla_breached",
        reason: result.reason || "Auto-generation failed",
      });

      // TODO: Send admin notification email
      console.error(
        `[SLA] Auto-Angebot failed for ${submission.id}: ${result.reason}`
      );
    }
  }

  console.log(`[SLA] Checked ${breached.length} breached submissions`, results);

  return NextResponse.json({
    checked: true,
    breached: breached.length,
    results,
  });
}
