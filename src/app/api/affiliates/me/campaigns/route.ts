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

  const now = new Date();

  // Get all active campaigns with their validity
  const campaigns = await prisma.campaign.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      promoCodes: {
        where: { affiliateId: session.affiliateId },
        select: { id: true, code: true, usedCount: true, active: true },
      },
    },
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      campaignCode: c.campaignCode,
      discountPercent: Number(c.discountPercent),
      description: c.description,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      joined: c.promoCodes.length > 0,
      myCode: c.promoCodes[0] ?? null,
    })),
  );
}
