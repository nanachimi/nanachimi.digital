import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAggregatedStats } from "@/lib/analytics";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth check
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const detail = searchParams.get("detail");

  // Detail view: return recent records with IPs for a specific page or "all"
  if (detail) {
    try {
      const where = detail === "all" ? {} : { path: detail };
      const recentViews = await prisma.pageView.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: 100,
        select: {
          id: true,
          visitorId: true,
          ip: true,
          path: true,
          referrer: true,
          utmSource: true,
          timeOnPage: true,
          timestamp: true,
        },
      });

      // Also get excluded IPs for marking
      const excludedIps = await prisma.excludedIp.findMany();
      const excludedSet = new Set(excludedIps.map((r) => r.ip));

      const enriched = recentViews.map((pv) => ({
        ...pv,
        isExcluded: pv.ip ? excludedSet.has(pv.ip) : false,
      }));

      return NextResponse.json({ views: enriched });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
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
