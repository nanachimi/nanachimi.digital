/**
 * Admin API — campaigns.
 *
 * - GET  /api/admin/campaigns   list
 * - POST /api/admin/campaigns   create a new campaign and auto-generate
 *                                the admin's PromoCode (code = campaignCode lowercased).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { composeAdminCode, isCodeAvailable } from "@/lib/promo";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  campaignCode: z
    .string()
    .min(2)
    .max(40)
    .regex(
      /^[A-Za-z][A-Za-z0-9]*$/,
      "campaignCode muss mit einem Buchstaben beginnen und darf nur Buchstaben und Zahlen enthalten",
    ),
  discountPercent: z.number().min(0.01).max(0.99),
  description: z.string().max(2000).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  maxUsesPerCode: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
});

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(request.url);
  const activeParam = url.searchParams.get("active");
  const where =
    activeParam === "true"
      ? { active: true }
      : activeParam === "false"
        ? { active: false }
        : {};

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { promoCodes: true } },
    },
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      ...c,
      discountPercent: Number(c.discountPercent),
    })),
  );
}

// ─── POST ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Admin promo code = campaignCode lowercased.
  const adminCode = composeAdminCode(data.campaignCode);

  const validFrom = data.validFrom ? new Date(data.validFrom) : new Date();
  const validUntil = data.validUntil ? new Date(data.validUntil) : null;

  // Uniqueness checks.
  const [codeTaken, codeAvailable] = await Promise.all([
    prisma.campaign.findUnique({ where: { campaignCode: data.campaignCode } }),
    isCodeAvailable(adminCode, validFrom, validUntil),
  ]);

  if (codeTaken) {
    return NextResponse.json(
      { error: "campaignCode ist bereits vergeben" },
      { status: 409 },
    );
  }
  if (!codeAvailable) {
    return NextResponse.json(
      {
        error: `Der Promo-Code "${adminCode}" kollidiert mit einem bestehenden aktiven Code im gleichen Zeitraum`,
      },
      { status: 409 },
    );
  }

  // Create Campaign + admin PromoCode atomically.
  const result = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        name: data.name,
        campaignCode: data.campaignCode,
        discountPercent: data.discountPercent,
        description: data.description,
        validFrom,
        validUntil,
        maxUsesPerCode: data.maxUsesPerCode,
        active: data.active ?? true,
      },
    });

    const promo = await tx.promoCode.create({
      data: {
        code: adminCode,
        campaignId: campaign.id,
        affiliateId: null, // admin code
        discountPercent: data.discountPercent,
        maxUses: data.maxUsesPerCode,
        usedCount: 0,
        active: true,
      },
    });

    return { campaign, adminPromoCode: promo };
  });

  return NextResponse.json(
    {
      ...result.campaign,
      discountPercent: Number(result.campaign.discountPercent),
      adminPromoCodeDetails: {
        ...result.adminPromoCode,
        discountPercent: Number(result.adminPromoCode.discountPercent),
      },
    },
    { status: 201 },
  );
}
