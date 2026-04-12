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

  const commissions = await prisma.commission.findMany({
    where: { affiliateId: session.affiliateId },
    orderBy: { earnedAt: "desc" },
    take: 100,
    select: {
      id: true,
      amount: true,
      rateSnapshot: true,
      status: true,
      earnedAt: true,
      approvedAt: true,
      commissionExpiresAt: true,
      paymentId: true,
    },
  });

  return NextResponse.json(
    commissions.map((c) => ({
      ...c,
      rateSnapshot: Number(c.rateSnapshot),
    })),
  );
}
