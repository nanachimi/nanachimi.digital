/**
 * Admin API — affiliates.
 *
 * - GET  /api/admin/affiliates        list (filterable by status)
 * - POST /api/admin/affiliates        create directly (bypasses application flow)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isValidHandle } from "@/lib/affiliate/attribution";
import { hashPassword, generateTempPassword } from "@/lib/affiliate/password";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  handle: z.string().min(3).max(32),
  commissionRate: z.number().min(0).max(1), // 0–100%
  status: z.enum(["pending", "active", "suspended"]).default("active"),
});

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where = status
    ? { status }
    : {};

  const affiliates = await prisma.affiliate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      handle: true,
      commissionRate: true,
      status: true,
      stripeOnboardingComplete: true,
      approvedAt: true,
      createdAt: true,
      _count: {
        select: {
          promoCodes: true,
          referrals: true,
          commissions: true,
        },
      },
    },
  });

  return NextResponse.json(
    affiliates.map((a) => ({
      ...a,
      commissionRate: Number(a.commissionRate),
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

  if (!isValidHandle(data.handle)) {
    return NextResponse.json(
      { error: "Handle ist reserviert oder hat ein ungültiges Format" },
      { status: 400 },
    );
  }

  // Uniqueness pre-check (DB will also enforce).
  const [emailTaken, handleTaken] = await Promise.all([
    prisma.affiliate.findUnique({ where: { email: data.email } }),
    prisma.affiliate.findUnique({ where: { handle: data.handle } }),
  ]);
  if (emailTaken) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits vergeben" },
      { status: 409 },
    );
  }
  if (handleTaken) {
    return NextResponse.json(
      { error: "Dieser Handle ist bereits vergeben" },
      { status: 409 },
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const affiliate = await prisma.affiliate.create({
    data: {
      email: data.email,
      name: data.name,
      handle: data.handle,
      commissionRate: data.commissionRate,
      passwordHash,
      status: data.status,
      approvedAt: data.status === "active" ? new Date() : null,
    },
  });

  // Return the temp password ONCE — admin must copy it to share with the
  // affiliate. It is not stored anywhere in cleartext.
  return NextResponse.json(
    {
      id: affiliate.id,
      email: affiliate.email,
      handle: affiliate.handle,
      name: affiliate.name,
      status: affiliate.status,
      commissionRate: Number(affiliate.commissionRate),
      tempPassword,
    },
    { status: 201 },
  );
}
