import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/commissions-approve
 *
 * Lifts `pending → approved` on commissions whose 14-day rétractation
 * window has elapsed. Voided commissions (refunds) are skipped because
 * the Stripe webhook flips them to `status = "void"` directly.
 *
 * Internal endpoint — localhost-only (enforced in middleware).
 * Scheduled by instrumentation.ts (daily).
 */
const HOLD_DAYS = 14;

export async function GET() {
  const cutoff = new Date(Date.now() - HOLD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const result = await prisma.commission.updateMany({
    where: {
      status: "pending",
      earnedAt: { lte: cutoff },
    },
    data: {
      status: "approved",
      approvedAt: now,
    },
  });

  if (result.count > 0) {
    console.log(
      `[Cron] commissions-approve: ${result.count} commission(s) → approved`,
    );
  }

  return NextResponse.json({
    checked: true,
    approved: result.count,
    cutoff: cutoff.toISOString(),
  });
}
