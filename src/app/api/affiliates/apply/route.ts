/**
 * Public API — submit an affiliate application.
 * POST /api/affiliates/apply
 *
 * Rate-limited, best-effort anti-spam. Creates an `AffiliateApplication`
 * row and fires both the applicant confirmation and internal notification
 * emails.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formLimiter } from "@/lib/auth/rate-limit";
import { isValidHandle, HANDLE_PATTERN } from "@/lib/affiliate/attribution";
import {
  sendAffiliateApplicationReceivedEmail,
  sendAffiliateApplicationInternalEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(200),
  handle: z
    .string()
    .min(3)
    .max(32)
    .regex(HANDLE_PATTERN, "Handle darf nur Buchstaben, Zahlen, _ oder - enthalten"),
  audience: z.string().min(20).max(3000),
  motivation: z.string().min(20).max(3000),
  /** Partner-AGB must be explicitly accepted. */
  agbAccepted: z.literal(true, {
    error: "Bitte akzeptieren Sie die Teilnahmebedingungen des Partnerprogramms.",
  }),
  /** Optional honeypot — bots tend to fill every field. */
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!formLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot — silently drop if filled
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  // Handle reservations — refuse common collisions early so the admin
  // doesn't have to clean up at approval time.
  if (!isValidHandle(data.handle)) {
    return NextResponse.json(
      { error: "Dieser Handle ist reserviert. Bitte wählen Sie einen anderen." },
      { status: 400 },
    );
  }

  // Soft check: reject if an affiliate with this email already exists.
  const existingAffiliate = await prisma.affiliate.findUnique({
    where: { email: data.email },
  });
  if (existingAffiliate) {
    return NextResponse.json(
      {
        error:
          "Für diese E-Mail existiert bereits ein Partner-Account. Bitte loggen Sie sich ein.",
      },
      { status: 409 },
    );
  }

  // Soft check: reject duplicate pending applications from same email.
  const existingPending = await prisma.affiliateApplication.findFirst({
    where: { email: data.email, status: "pending" },
  });
  if (existingPending) {
    return NextResponse.json(
      {
        error:
          "Sie haben bereits eine offene Bewerbung. Wir melden uns in Kürze bei Ihnen.",
      },
      { status: 409 },
    );
  }

  const application = await prisma.affiliateApplication.create({
    data: {
      email: data.email,
      name: data.name,
      handle: data.handle,
      audience: data.audience,
      motivation: data.motivation,
      status: "pending",
      applicationIp: ip !== "unknown" ? ip : null,
      agbAccepted: true,
      agbAcceptedAt: new Date(),
    },
  });

  // Fire-and-forget emails.
  try {
    await Promise.all([
      sendAffiliateApplicationReceivedEmail({
        to: data.email,
        name: data.name,
      }),
      sendAffiliateApplicationInternalEmail({
        applicantEmail: data.email,
        applicantName: data.name,
        handle: data.handle,
        audience: data.audience,
        motivation: data.motivation,
        applicationId: application.id,
      }),
    ]);
  } catch (emailError) {
    console.error("[Affiliate apply] Email dispatch failed:", emailError);
    // Do not fail the application on email errors — admin can still review.
  }

  return NextResponse.json({ ok: true, id: application.id }, { status: 201 });
}
