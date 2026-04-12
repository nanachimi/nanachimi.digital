/**
 * Admin API — single affiliate.
 *
 * - GET   /api/admin/affiliates/[id]   detail with stats
 * - PATCH /api/admin/affiliates/[id]   update rate / status / name / email
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  status: z.enum(["pending", "active", "suspended"]).optional(),
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

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      promoCodes: {
        select: {
          id: true,
          code: true,
          campaignId: true,
          discountPercent: true,
          usedCount: true,
          maxUses: true,
          active: true,
          createdAt: true,
          campaign: { select: { name: true, campaignCode: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      commissions: {
        select: {
          id: true,
          amount: true,
          status: true,
          earnedAt: true,
          approvedAt: true,
          commissionExpiresAt: true,
          payoutId: true,
        },
        orderBy: { earnedAt: "desc" },
        take: 50,
      },
      payouts: {
        select: {
          id: true,
          amountTotal: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          paidAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: {
          referrals: true,
          submissionsWon: true,
        },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json(
      { error: "Affiliate nicht gefunden" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...affiliate,
    passwordHash: undefined, // never leak
    commissionRate: Number(affiliate.commissionRate),
    promoCodes: affiliate.promoCodes.map((p) => ({
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

  const existing = await prisma.affiliate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Affiliate nicht gefunden" },
      { status: 404 },
    );
  }

  // If flipping pending → active for the first time, stamp approvedAt.
  const patch = parsed.data;
  const approvedAt =
    patch.status === "active" && existing.status !== "active"
      ? new Date()
      : undefined;

  try {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: {
        ...patch,
        ...(approvedAt ? { approvedAt } : {}),
      },
    });

    return NextResponse.json({
      ...updated,
      passwordHash: undefined,
      commissionRate: Number(updated.commissionRate),
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "E-Mail oder Handle bereits vergeben" },
        { status: 409 },
      );
    }
    throw err;
  }
}
