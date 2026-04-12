import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";

export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const payouts = await prisma.payout.findMany({
    where: { affiliateId: session.affiliateId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amountTotal: true,
      currency: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
      paidAt: true,
    },
  });

  return NextResponse.json(payouts);
}
