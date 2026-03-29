import { NextResponse } from "next/server";
import { getRunningTests } from "@/lib/ab-tests";

/**
 * GET /api/ab-tests/active
 *
 * Public endpoint (no auth). Returns only running tests with their variants.
 * Called by ABProvider on every page load. Kept lightweight — no events data.
 */
export async function GET() {
  const tests = (await getRunningTests()).map((t) => ({
    id: t.id,
    targetElement: t.targetElement,
    variants: t.variants.map((v) => ({
      id: v.id,
      config: v.config,
      weight: v.weight,
    })),
  }));

  return NextResponse.json(tests, {
    headers: {
      // Cache for 60 seconds — variant assignment is client-side anyway
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
