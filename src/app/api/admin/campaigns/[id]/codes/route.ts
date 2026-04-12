/**
 * Admin API — list all PromoCodes belonging to a campaign.
 * GET /api/admin/campaigns/[id]/codes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign nicht gefunden" },
      { status: 404 },
    );
  }

  const codes = await prisma.promoCode.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        select: { id: true, name: true, handle: true, email: true },
      },
      _count: { select: { submissions: true } },
    },
  });

  return NextResponse.json(
    codes.map((c) => ({
      ...c,
      discountPercent: Number(c.discountPercent),
    })),
  );
}
