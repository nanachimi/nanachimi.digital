/**
 * Admin API — toggle a campaign active/inactive.
 * POST /api/admin/campaigns/[id]/toggle
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign nicht gefunden" },
      { status: 404 },
    );
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { active: !campaign.active },
  });

  return NextResponse.json({
    id: updated.id,
    active: updated.active,
  });
}
