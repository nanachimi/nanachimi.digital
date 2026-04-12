/**
 * Admin API — single campaign.
 *
 * - GET    detail (with promo codes and participant list)
 * - PATCH  update cosmetic fields
 *
 * Note: `campaignCode` and `discountPercent` are intentionally immutable
 * after creation — changing them would invalidate every PromoCode an
 * affiliate has already generated and every code a customer may already
 * hold in their inbox.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullish(),
  maxUsesPerCode: z.number().int().min(1).nullish(),
  active: z.boolean().optional(),
});

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
    include: {
      promoCodes: {
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: {
            select: { id: true, name: true, handle: true, email: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign nicht gefunden" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...campaign,
    discountPercent: Number(campaign.discountPercent),
    promoCodes: campaign.promoCodes.map((p) => ({
      ...p,
      discountPercent: Number(p.discountPercent),
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Campaign nicht gefunden" },
      { status: 404 },
    );
  }

  const patch = parsed.data;

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      name: patch.name,
      description: patch.description,
      validFrom: patch.validFrom ? new Date(patch.validFrom) : undefined,
      validUntil:
        patch.validUntil === null
          ? null
          : patch.validUntil
            ? new Date(patch.validUntil)
            : undefined,
      maxUsesPerCode:
        patch.maxUsesPerCode === null ? null : patch.maxUsesPerCode,
      active: patch.active,
    },
  });

  return NextResponse.json({
    ...updated,
    discountPercent: Number(updated.discountPercent),
  });
}
