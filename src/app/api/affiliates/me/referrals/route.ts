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

  const referrals = await prisma.referral.findMany({
    where: { affiliateId: session.affiliateId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      source: true,
      firstTouchAt: true,
      convertedAt: true,
      submissionId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(referrals);
}
