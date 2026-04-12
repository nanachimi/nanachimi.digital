/**
 * Public endpoint to validate a promo code without consuming it.
 *
 * Called from StepAbschluss (onboarding step 13) while the customer types
 * their Gutscheincode — returns just enough information to show a live
 * checkmark and the discount percentage.
 *
 * Rate-limited aggressively because the code format is partially
 * guessable (`CampaignCode` + `Percentage` are predictable, only the
 * affiliate suffix is unknown — brute-force enumeration of valid suffixes
 * is the main abuse vector we care about).
 */

import { NextResponse } from "next/server";
import { publicApiLimiter } from "@/lib/auth/rate-limit";
import { validatePromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!publicApiLimiter.check(ip)) {
    return NextResponse.json(
      { valid: false, reason: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, reason: "invalid_request" },
      { status: 400 },
    );
  }

  const code =
    body && typeof body === "object" && "code" in body
      ? String((body as { code: unknown }).code ?? "").trim()
      : "";

  if (!code) {
    return NextResponse.json(
      { valid: false, reason: "not_found" },
      { status: 200 },
    );
  }

  if (code.length > 60) {
    return NextResponse.json(
      { valid: false, reason: "not_found" },
      { status: 200 },
    );
  }

  const result = await validatePromoCode(code);

  if (!result.valid) {
    return NextResponse.json(
      { valid: false, reason: result.reason },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      valid: true,
      code: result.code,
      discountPercent: Math.round(result.discountPercent * 100),
      campaignId: result.campaignId,
    },
    { status: 200 },
  );
}
