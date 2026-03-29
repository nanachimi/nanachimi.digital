import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getPricingConfig,
  updatePricingConfig,
  type PricingConfig,
} from "@/lib/pricing-config";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings/pricing — Get current pricing config
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  return NextResponse.json(await getPricingConfig());
}

/**
 * PATCH /api/admin/settings/pricing — Update pricing config (partial)
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<PricingConfig>;

    // Validate payment terms sum to 100% if provided
    if (body.zahlungsbedingungen) {
      const sum = body.zahlungsbedingungen.reduce(
        (acc, t) => acc + t.prozent,
        0
      );
      if (sum !== 100) {
        return NextResponse.json(
          {
            error: `Zahlungsbedingungen müssen 100% ergeben (aktuell: ${sum}%)`,
          },
          { status: 400 }
        );
      }
    }

    // Validate weekly rates hierarchy if provided
    if (body.weeklyRates) {
      const r = body.weeklyRates;
      if (r["48h"] <= r["1-2wochen"]) {
        return NextResponse.json(
          { error: "48h-Rate muss höher als 1-2 Wochen sein" },
          { status: 400 }
        );
      }
      if (r["1-2wochen"] <= r["1monat"]) {
        return NextResponse.json(
          { error: "1-2 Wochen-Rate muss höher als 1 Monat sein" },
          { status: 400 }
        );
      }
      if (r["1monat"] <= r.flexibel) {
        return NextResponse.json(
          { error: "1 Monat-Rate muss höher als Flexibel sein" },
          { status: 400 }
        );
      }
    }

    const updated = await updatePricingConfig(body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Ungültige Daten" },
      { status: 400 }
    );
  }
}
