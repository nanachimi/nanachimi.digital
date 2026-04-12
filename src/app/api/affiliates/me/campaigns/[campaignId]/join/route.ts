import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";
import { composeAffiliateCode, isCodeAvailable } from "@/lib/promo";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: "Kampagne nicht gefunden oder inaktiv" }, { status: 404 });
  }

  const now = new Date();
  if (campaign.validFrom > now) {
    return NextResponse.json({ error: "Kampagne ist noch nicht aktiv" }, { status: 400 });
  }
  if (campaign.validUntil && campaign.validUntil < now) {
    return NextResponse.json({ error: "Kampagne ist abgelaufen" }, { status: 400 });
  }

  // Check if already joined
  const existing = await prisma.promoCode.findFirst({
    where: { campaignId, affiliateId: session.affiliateId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Sie nehmen bereits an dieser Kampagne teil", code: existing.code },
      { status: 409 },
    );
  }

  // Compose code: handle + discountPercent
  const code = composeAffiliateCode(session.handle, Number(campaign.discountPercent));

  // Check temporal uniqueness
  const available = await isCodeAvailable(
    code,
    campaign.validFrom,
    campaign.validUntil,
  );
  if (!available) {
    return NextResponse.json(
      { error: `Der Code "${code}" ist im gleichen Zeitraum bereits vergeben. Bitte kontaktieren Sie den Support.` },
      { status: 409 },
    );
  }

  const promo = await prisma.promoCode.create({
    data: {
      code,
      campaignId,
      affiliateId: session.affiliateId,
      discountPercent: campaign.discountPercent,
      maxUses: campaign.maxUsesPerCode,
      active: true,
    },
  });

  return NextResponse.json(
    { code: promo.code, id: promo.id },
    { status: 201 },
  );
}
