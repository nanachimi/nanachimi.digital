import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAggregatedStats } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json(
      { error: msg === "SESSION_EXPIRED" ? "Sitzung abgelaufen" : "Nicht autorisiert" },
      { status: 401 }
    );
  }

  try {
    const stats = await getAggregatedStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[Analytics] Stats aggregation failed:", err);
    return NextResponse.json(
      { error: "Analytics konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}
