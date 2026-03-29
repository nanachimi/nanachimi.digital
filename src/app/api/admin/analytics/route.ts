import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAggregatedStats } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  // Auth check
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  // Stats aggregation
  try {
    const stats = await getAggregatedStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Analytics] Aggregation failed:", message);
    return NextResponse.json(
      { error: `Analytics-Fehler: ${message}` },
      { status: 500 }
    );
  }
}
