/**
 * Admin API — reject an affiliate application.
 * POST /api/admin/affiliates/applications/[id]/reject
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendAffiliateApplicationRejectedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  notes: z.string().max(2000).optional(),
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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
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

  const updated = await prisma.affiliateApplication.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: String(session.username ?? "admin"),
      notes: parsed.data.notes,
    },
  });

  try {
    await sendAffiliateApplicationRejectedEmail({
      to: application.email,
      name: application.name,
    });
  } catch (emailError) {
    console.error("[Affiliate] Rejection email failed:", emailError);
  }

  return NextResponse.json(updated);
}
