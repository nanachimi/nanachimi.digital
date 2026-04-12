/**
 * Admin API — approve an affiliate application.
 * POST /api/admin/affiliates/applications/[id]/approve
 *
 * Creates an Affiliate row, stamps the application as approved, and
 * enqueues the approval email with a temporary password the affiliate
 * must rotate on first login.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isValidHandle } from "@/lib/affiliate/attribution";
import { hashPassword, generateTempPassword } from "@/lib/affiliate/password";
import { sendAffiliateApprovedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** Admin can override the requested handle. */
  handle: z.string().min(3).max(32).optional(),
  /** Commission rate as fraction (0.10 = 10 %). */
  commissionRate: z.number().min(0).max(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const application = await prisma.affiliateApplication.findUnique({
    where: { id },
  });
  if (!application) {
    return NextResponse.json(
      { error: "Bewerbung nicht gefunden" },
      { status: 404 },
    );
  }
  if (application.status !== "pending") {
    return NextResponse.json(
      { error: `Bewerbung bereits bearbeitet (${application.status})` },
      { status: 400 },
    );
  }

  const handle = parsed.data.handle ?? application.handle;
  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: "Handle ist reserviert oder hat ein ungültiges Format" },
      { status: 400 },
    );
  }

  const [emailTaken, handleTaken] = await Promise.all([
    prisma.affiliate.findUnique({ where: { email: application.email } }),
    prisma.affiliate.findUnique({ where: { handle } }),
  ]);
  if (emailTaken) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits einem Affiliate zugewiesen" },
      { status: 409 },
    );
  }
  if (handleTaken) {
    return NextResponse.json(
      { error: "Dieser Handle ist bereits vergeben — bitte abändern" },
      { status: 409 },
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const adminId = String(session.username ?? "admin");

  const affiliate = await prisma.$transaction(async (tx) => {
    const created = await tx.affiliate.create({
      data: {
        email: application.email,
        name: application.name,
        handle,
        commissionRate: parsed.data.commissionRate,
        passwordHash,
        status: "active",
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    await tx.affiliateApplication.update({
      where: { id: application.id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: adminId,
        affiliateId: created.id,
      },
    });

    return created;
  });

  // Send email with temp password — do not fail the approval if email fails.
  try {
    await sendAffiliateApprovedEmail({
      to: affiliate.email,
      name: affiliate.name,
      handle: affiliate.handle,
      tempPassword,
    });
  } catch (emailError) {
    console.error("[Affiliate] Approval email failed:", emailError);
  }

  return NextResponse.json({
    id: affiliate.id,
    email: affiliate.email,
    handle: affiliate.handle,
    name: affiliate.name,
    status: affiliate.status,
    commissionRate: Number(affiliate.commissionRate),
    tempPassword,
  });
}
