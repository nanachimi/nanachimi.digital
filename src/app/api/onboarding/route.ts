import { NextResponse } from "next/server";
import { fullOnboardingSchema } from "@/lib/onboarding-schema";
import { calculateEstimate } from "@/lib/estimation";
import { addSubmission } from "@/lib/submissions";
import { sendOnboardingConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = fullOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

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

    // Store submission
    await addSubmission({
      id,
      createdAt: now.toISOString(),
      status: initialStatus,
      name: data.name,
      email: data.email,
      firma: data.firma,
      telefon: data.telefon,
      projekttyp: data.projekttyp,
      beschreibung: data.beschreibung,
      zielgruppe: data.zielgruppe,
      funktionen: data.funktionen,
      rollenAnzahl: data.rollenAnzahl,
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
    });

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
    }).catch((err) => {
      console.error("[Onboarding] Confirmation email failed:", err);
    });

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
