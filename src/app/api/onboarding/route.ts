import { NextResponse } from "next/server";
import { fullOnboardingSchema } from "@/lib/onboarding-schema";
import { calculateEstimate } from "@/lib/estimation";
import { addSubmission } from "@/lib/submissions";
import { sendOnboardingConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { WHATSAPP_CONSENT_VERSION, normalizePhoneNumber } from "@/lib/whatsapp";
import { formLimiter } from "@/lib/auth/rate-limit";
import { validatePromoCode } from "@/lib/promo";
import {
  REF_COOKIE_NAME,
  resolveAttribution,
  upsertReferral,
} from "@/lib/affiliate/attribution";
import { checkSelfReferral } from "@/lib/affiliate/self-referral";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!formLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = fullOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // ─── Affiliate attribution ──────────────────────────────────────
    // Read the ncd_ref cookie (set by middleware when visitor lands on /@handle)
    // and the ncd-ab cookie (shared visitor id used by the analytics pipeline).
    const refCookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${REF_COOKIE_NAME}=`));
    const cookieHandle = refCookie
      ? decodeURIComponent(refCookie.slice(REF_COOKIE_NAME.length + 1)) || null
      : null;

    const visitorCookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("ncd-ab="));
    const visitorId = visitorCookie
      ? decodeURIComponent(visitorCookie.slice("ncd-ab=".length)) || undefined
      : undefined;

    // Validate promo code (case-sensitive, joins with Campaign).
    const submittedPromo = data.promoCode?.trim() || "";
    const promoValidation = submittedPromo
      ? await validatePromoCode(submittedPromo)
      : null;
    const validPromo =
      promoValidation && promoValidation.valid ? promoValidation : null;

    // Resolve attribution (promo wins over cookie; cookie still logged for analytics).
    const attribution = await resolveAttribution({
      cookieHandle,
      promoCode: validPromo
        ? { id: validPromo.id, affiliateId: validPromo.affiliateId }
        : null,
    });

    // ─── Self-referral check ───────────────────────────────────────
    // If the submitter is the winning affiliate (by IP or active session),
    // strip the affiliate attribution. The submission still succeeds — the
    // customer is never affected.
    let effectiveWinnerAffiliateId = attribution.winnerAffiliateId;

    if (attribution.winnerAffiliateId) {
      // Read the affiliate session cookie (set when affiliate logs into portal).
      const affSessionCookie = request.headers
        .get("cookie")
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("ncd-affiliate-session="));
      // We cannot decrypt the iron-session cookie here (no async decrypt in
      // the submission hot path), so we parse the affiliateId from the
      // cookie payload only if the portal injects a plain marker. For now,
      // we rely on the IP check as the primary detection mechanism, and
      // treat the session cookie as a secondary signal by checking if any
      // affiliate session exists.
      const affiliateSessionId: string | null = affSessionCookie
        ? attribution.winnerAffiliateId // conservative: if session exists, assume it's the winner
        : null;

      const selfRef = await checkSelfReferral({
        submissionIp: ip,
        winnerAffiliateId: attribution.winnerAffiliateId,
        affiliateSessionId,
      });

      if (selfRef.blocked) {
        effectiveWinnerAffiliateId = null;
        // Log as incident for admin visibility (fire-and-forget).
        import("@/lib/job-queue")
          .then(({ createIncident }) =>
            createIncident({
              severity: "warning",
              title: "Selbstvermittlung erkannt",
              message: `Affiliate-Zuordnung entfernt.\n\nGrund: ${selfRef.reason}\nAffiliate: ${attribution.winnerAffiliateId}\nIP: ${ip}\nKunde: ${data.email}`,
              source: "affiliate",
              referenceId: attribution.winnerAffiliateId ?? undefined,
            }),
          )
          .catch(() => {/* incident creation best-effort */});
      }
    }

    // Server-side verification: if whatsappConsent is true with a phone, verify it was confirmed
    if (data.whatsappConsent && data.telefon) {
      const normalizedPhone = normalizePhoneNumber(data.telefon);
      if (normalizedPhone) {
        const verified = await prisma.phoneVerification.findFirst({
          where: { phone: normalizedPhone, verified: true },
          orderBy: { createdAt: "desc" },
        });
        if (!verified) {
          return NextResponse.json(
            { error: "Telefonnummer muss verifiziert sein, um WhatsApp-Nachrichten zu erhalten." },
            { status: 400 }
          );
        }
      }
    }

    // Calculate estimate (includes range, risk, SLA, demand factor)
    const estimate = await calculateEstimate({
      projekttyp: data.projekttyp,
      funktionen: data.funktionen,
      rollenAnzahl: data.rollenAnzahl,
      designLevel: data.designLevel,
      zeitrahmenMvp: data.zeitrahmenMvp,
      zeitrahmenFinal: data.zeitrahmenFinal,
      budget: data.budget,
      betriebUndWartung: data.betriebUndWartung,
      appStruktur: data.appStruktur,
      rollenApps: data.rollenApps,
    });

    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();

    // Determine initial status based on customer choice
    const isCall = data.naechsterSchritt === "call";
    const initialStatus = isCall ? "call_requested" : "sla_active";

    // Calculate SLA deadline (only for Angebot path)
    let slaDeadline: string | undefined;
    let slaStartedAt: string | undefined;
    if (!isCall) {
      slaStartedAt = now.toISOString();
      slaDeadline = new Date(
        now.getTime() + estimate.slaMinutes * 60 * 1000
      ).toISOString();
    }

    // WhatsApp consent — compute DSGVO fields
    const normalizedPhone = normalizePhoneNumber(data.telefon ?? "");
    const whatsappConsentAt =
      data.whatsappConsent && normalizedPhone ? now.toISOString() : undefined;
    const whatsappConsentVersion =
      whatsappConsentAt ? WHATSAPP_CONSENT_VERSION : undefined;

    // Store submission
    await addSubmission({
      id,
      createdAt: now.toISOString(),
      status: initialStatus,
      name: data.name,
      email: data.email,
      firma: data.firma,
      telefon: data.telefon,
      whatsappConsent: data.whatsappConsent ?? false,
      whatsappConsentAt,
      whatsappConsentVersion,
      projekttyp: data.projekttyp,
      beschreibung: data.beschreibung,
      zielgruppe: data.zielgruppe,
      funktionen: data.funktionen,
      rollenAnzahl: data.rollenAnzahl,
      rollenName: data.rollenName,
      rollenBeschreibung: data.rollenBeschreibung,
      appStruktur: data.appStruktur,
      rollenApps: data.rollenApps,
      designLevel: data.designLevel,
      zeitrahmenMvp: data.zeitrahmenMvp,
      zeitrahmenFinal: data.zeitrahmenFinal,
      budget: data.budget,
      betriebUndWartung: data.betriebUndWartung,
      zusatzinfo: data.zusatzinfo,
      markenname: data.markenname,
      domain: data.domain,
      brandingInfo: data.brandingInfo,
      funktionenGruppen: data.funktionenGruppen,
      inspirationUrls: data.inspirationUrls,
      monetarisierung: data.monetarisierung,
      monetarisierungDetails: data.monetarisierungDetails,
      werZahlt: data.werZahlt,
      zahlendeGruppen: data.zahlendeGruppen,
      naechsterSchritt: data.naechsterSchritt,
      estimate: {
        festpreis: estimate.festpreis,
        aufwand: estimate.aufwand,
        weeklyRate: estimate.weeklyRate,
        assumptions: estimate.assumptions,
        exclusions: estimate.exclusions,
        riskLevel: estimate.riskLevel,
      },
      range: estimate.range,
      riskLevel: estimate.riskLevel,
      slaMinutes: estimate.slaMinutes,
      slaDeadline,
      slaStartedAt,
      demandFactor: estimate.demandFactor,
      visitorId,
      promoCode: validPromo ? validPromo.code : undefined,
      promoCodeId: validPromo?.id,
      affiliateId: effectiveWinnerAffiliateId || undefined,
      firstTouchAffiliateId: attribution.firstTouchAffiliateId ?? undefined,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    });

    // Bump the usedCount on the promo code exactly once per consumption.
    if (validPromo) {
      await prisma.promoCode.update({
        where: { id: validPromo.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Record / update the Referral row so commission creation has a firstTouchAt anchor.
    // Only create if the effective winner survived the self-referral check.
    if (effectiveWinnerAffiliateId && visitorId) {
      await upsertReferral({
        visitorId,
        affiliateId: effectiveWinnerAffiliateId,
        source: attribution.source === "promo_code" ? "promo_code" : "handle_link",
        submissionId: id,
      });
    }

    // Link uploaded files (by tempToken from fileIds) to the new submission
    if (data.fileIds && data.fileIds.length > 0) {
      await prisma.submissionFile.updateMany({
        where: { id: { in: data.fileIds } },
        data: { submissionId: id },
      });
    }

    // Send confirmation email with preliminary range (fire-and-forget)
    sendOnboardingConfirmationEmail({
      to: data.email,
      kundenName: data.name,
      projektBeschreibung: data.beschreibung,
      range: estimate.range,
      aufwand: estimate.aufwand,
      riskLevel: estimate.riskLevel,
      slaMinutes: estimate.slaMinutes,
      naechsterSchritt: data.naechsterSchritt,
      betriebUndWartung: data.betriebUndWartung,
      bwInfo: estimate.bwInfo,
    }).catch(async (err) => {
      console.error("[Onboarding] Confirmation email failed:", err);
      try {
        const { createIncident } = await import("@/lib/job-queue");
        await createIncident({
          severity: "warning",
          title: "Bestätigungs-E-Mail fehlgeschlagen",
          message: `E-Mail an ${data.email} konnte nicht gesendet werden.\n\nFehler: ${err instanceof Error ? err.message : String(err)}\nSubmission: ${id}`,
          source: "email",
          referenceId: id,
        });
      } catch { /* incident creation best-effort */ }
    });

    // Enqueue WhatsApp jobs (fire-and-forget)
    import("@/lib/whatsapp-jobs")
      .then(({ enqueueWhatsAppJobs }) => enqueueWhatsAppJobs(id))
      .catch((err) => {
        console.error("[Onboarding] WhatsApp enqueue failed:", err);
      });

    // Admin notification (fire-and-forget)
    import("@/lib/notifications")
      .then(({ notifyNewSubmission }) =>
        notifyNewSubmission({
          submissionId: id,
          name: data.name,
          projekttyp: data.projekttyp,
          naechsterSchritt: data.naechsterSchritt,
          range: estimate.range,
        })
      )
      .catch(() => {/* notification best-effort */});

    return NextResponse.json({
      success: true,
      id,
      riskLevel: estimate.riskLevel,
      slaMinutes: estimate.slaMinutes,
    });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
