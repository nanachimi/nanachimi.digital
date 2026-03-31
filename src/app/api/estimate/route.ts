import { NextResponse } from "next/server";
import { calculateEstimate } from "@/lib/estimation";
import { publicApiLimiter } from "@/lib/auth/rate-limit";

/**
 * POST /api/estimate — Public endpoint for client-side estimate preview.
 *
 * Returns a preliminary range, effort, risk level, SLA, and B&W info.
 * This is called from the onboarding form (step 11) to show the customer
 * a rough estimate before they choose their conversion path.
 *
 * Does NOT create a submission — that happens on /api/onboarding.
 */
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!publicApiLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const estimate = await calculateEstimate({
      projekttyp: body.projekttyp || "web",
      funktionen: body.funktionen || [],
      rollenAnzahl: body.rollenAnzahl || "1",
      designLevel: body.designLevel || "standard",
      zeitrahmenMvp: body.zeitrahmenMvp || "flexibel",
      zeitrahmenFinal: body.zeitrahmenFinal || "2-3monate",
      budget: body.budget,
      betriebUndWartung: body.betriebUndWartung,
      appStruktur: body.appStruktur,
      rollenApps: body.rollenApps,
    });

    // Return only customer-safe data (no internal pricing details)
    return NextResponse.json({
      range: estimate.range,
      aufwand: estimate.aufwand,
      riskLevel: estimate.riskLevel,
      slaMinutes: estimate.slaMinutes,
      bwInfo: estimate.bwInfo,
    });
  } catch {
    return NextResponse.json(
      { error: "Berechnung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
