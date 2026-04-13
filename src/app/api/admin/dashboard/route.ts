import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fillDailyGaps(
  map: Map<string, number>,
  days: number,
): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = toDateKey(daysAgo(i));
    result.push({ date: key, value: map.get(key) ?? 0 });
  }
  return result;
}

const OPEN_STATUSES = [
  "pending",
  "call_requested",
  "sla_active",
  "sla_breached",
  "auto_generated",
  "amended",
  "angebot_sent",
];

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = toDateKey(now);
  const d7 = daysAgo(7);
  const d14 = daysAgo(14);
  const d30 = daysAgo(30);
  const d60 = daysAgo(60);
  const d90 = daysAgo(90);
  const d180 = daysAgo(180);
  const d7future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Load excluded IPs for analytics filtering
  const excludedIpRecords = await prisma.excludedIp.findMany();
  const excludedIpArray = excludedIpRecords.map((r) => r.ip);
  const ipFilter =
    excludedIpArray.length > 0
      ? { OR: [{ ip: { equals: null } }, { ip: { notIn: excludedIpArray } }] }
      : {};

  const [
    // Group A: Pipeline & Revenue
    openSubmissions,
    paidPayments30d,
    paidPaymentsPrev30d,
    pendingPayments,
    sentAngebote,

    // Group B: Leads & Conversion
    leadsLast14d,
    statusCounts,
    slaActive,
    slaBreached,
    acceptedAngebote90d,
    acceptedAngebotePrev90d,

    // Group C: Operations
    upcomingBookings,
    openIncidents,
    failedJobs,
    pendingJobs,

    // Group D: Traffic & Funnel
    pageViews30d,
    funnelEvents,
  ] = await Promise.all([
    // A: Pipeline
    prisma.submission.findMany({
      where: { status: { in: OPEN_STATUSES } },
      select: { estimate: true },
    }),
    prisma.payment.findMany({
      where: { status: "paid", paidAt: { gte: d30 } },
      select: { amount: true, paidAt: true },
    }),
    prisma.payment.aggregate({
      where: { status: "paid", paidAt: { gte: d60, lt: d30 } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.angebot.findMany({
      where: { status: "sent" },
      select: { festpreis: true },
    }),

    // B: Leads
    prisma.submission.findMany({
      where: { createdAt: { gte: d14 } },
      select: { createdAt: true },
    }),
    prisma.submission.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.submission.count({ where: { status: "sla_active" } }),
    prisma.submission.count({ where: { status: "sla_breached" } }),
    prisma.angebot.findMany({
      where: {
        status: "accepted",
        createdAt: { gte: d90 },
      },
      select: { festpreis: true },
    }),
    prisma.angebot.findMany({
      where: {
        status: "accepted",
        createdAt: { gte: d180, lt: d90 },
      },
      select: { festpreis: true },
    }),

    // C: Operations
    prisma.booking.findMany({
      where: {
        status: "confirmed",
        date: { gte: today, lte: toDateKey(d7future) },
      },
      select: { date: true, startTime: true, name: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    prisma.incident.groupBy({
      by: ["severity"],
      where: { status: { in: ["open", "acknowledged"] } },
      _count: true,
    }),
    prisma.job.count({ where: { status: "failed" } }),
    prisma.job.count({ where: { status: "pending" } }),

    // D: Traffic & Funnel
    prisma.pageView.findMany({
      where: { timestamp: { gte: d30 }, ...ipFilter },
      select: { visitorId: true, timestamp: true, referrer: true, utmSource: true },
    }),
    prisma.onboardingAnalyticsEvent.findMany({
      where: ipFilter,
      select: { step: true, stepName: true, type: true, duration: true },
    }),
  ]);

  // ── Group A: Pipeline & Revenue ──────────────────────────────────────

  let pipelineValue = 0;
  for (const s of openSubmissions) {
    const est = s.estimate as { festpreis?: number } | null;
    if (est?.festpreis) pipelineValue += est.festpreis;
  }

  const revenueLast30d = paidPayments30d.reduce((s, p) => s + p.amount, 0);
  const revenuePrev30d = paidPaymentsPrev30d._sum.amount ?? 0;

  // Daily revenue breakdown
  const revDailyMap = new Map<string, number>();
  for (const p of paidPayments30d) {
    if (p.paidAt) {
      const key = toDateKey(p.paidAt);
      revDailyMap.set(key, (revDailyMap.get(key) ?? 0) + p.amount);
    }
  }
  const revenueDaily = fillDailyGaps(revDailyMap, 30);

  // ── Group B: Leads & Conversion ──────────────────────────────────────

  const leadsLast7d = leadsLast14d.filter((s) => s.createdAt >= d7).length;
  const leadsPrev7d = leadsLast14d.filter(
    (s) => s.createdAt >= d14 && s.createdAt < d7,
  ).length;

  // Daily leads breakdown (14 days)
  const leadsDailyMap = new Map<string, number>();
  for (const s of leadsLast14d) {
    const key = toDateKey(s.createdAt);
    leadsDailyMap.set(key, (leadsDailyMap.get(key) ?? 0) + 1);
  }
  const leadsDaily = fillDailyGaps(leadsDailyMap, 14);

  // Conversion rate
  const statusMap = new Map(statusCounts.map((s) => [s.status, s._count]));
  const accepted =
    (statusMap.get("accepted") ?? 0) +
    (statusMap.get("project_bootstrapped") ?? 0);
  const rejected = statusMap.get("rejected_by_client") ?? 0;
  const sent = statusMap.get("angebot_sent") ?? 0;
  const convDenom = accepted + rejected + sent;
  const conversionRate = convDenom > 0 ? accepted / convDenom : 0;

  // Avg project value
  const avgProjVal90d =
    acceptedAngebote90d.length > 0
      ? acceptedAngebote90d.reduce((s, a) => s + a.festpreis, 0) /
        acceptedAngebote90d.length
      : 0;
  const avgProjValPrev90d =
    acceptedAngebotePrev90d.length > 0
      ? acceptedAngebotePrev90d.reduce((s, a) => s + a.festpreis, 0) /
        acceptedAngebotePrev90d.length
      : 0;

  // ── Group C: Operations ──────────────────────────────────────────────

  const incidentMap = new Map(
    openIncidents.map((i) => [i.severity, i._count]),
  );

  // ── Group D: Traffic & Funnel ────────────────────────────────────────

  // Daily unique visitors (30d)
  const visitorsByDay = new Map<string, Set<string>>();
  const sourceMap = new Map<string, number>();

  for (const pv of pageViews30d) {
    const key = toDateKey(pv.timestamp);
    if (!visitorsByDay.has(key)) visitorsByDay.set(key, new Set());
    visitorsByDay.get(key)!.add(pv.visitorId);

    const source = pv.utmSource || pv.referrer || "direkt";
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  }

  const visitorsDailyMap = new Map<string, number>();
  visitorsByDay.forEach((set, key) => {
    visitorsDailyMap.set(key, set.size);
  });
  const visitorsDaily = fillDailyGaps(visitorsDailyMap, 30);

  const visitors7d = new Set<string>();
  const visitorsPrev7d = new Set<string>();
  for (const pv of pageViews30d) {
    if (pv.timestamp >= d7) visitors7d.add(pv.visitorId);
    else if (pv.timestamp >= d14) visitorsPrev7d.add(pv.visitorId);
  }

  // Top 5 traffic sources
  const topSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Onboarding funnel
  const stepMap = new Map<
    number,
    { stepName: string; entries: number; completions: number }
  >();
  for (const ev of funnelEvents) {
    const entry = stepMap.get(ev.step) ?? {
      stepName: ev.stepName,
      entries: 0,
      completions: 0,
    };
    if (ev.type === "step_enter") entry.entries++;
    if (ev.type === "step_complete") entry.completions++;
    stepMap.set(ev.step, entry);
  }
  const funnel = Array.from(stepMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, d]) => ({
      stepName: d.stepName,
      entries: d.entries,
      completions: d.completions,
      dropOff: d.entries > 0 ? Math.round((1 - d.completions / d.entries) * 100) : 0,
    }));

  const funnelStart = funnel[0]?.entries ?? 0;
  const funnelEnd =
    funnelEvents.filter((e) => e.type === "funnel_complete").length;
  const funnelCompletionRate =
    funnelStart > 0 ? funnelEnd / funnelStart : 0;

  // ── Response ─────────────────────────────────────────────────────────

  return NextResponse.json({
    pipeline: {
      totalValue: pipelineValue,
      count: openSubmissions.length,
    },
    revenue: {
      last30Days: revenueLast30d,
      previous30Days: revenuePrev30d,
      dailyBreakdown: revenueDaily,
    },
    pendingPayments: {
      totalValue: pendingPayments._sum.amount ?? 0,
      count: pendingPayments._count,
    },
    openOffers: {
      totalValue: sentAngebote.reduce((s, a) => s + a.festpreis, 0),
      count: sentAngebote.length,
    },
    newLeads: {
      last7Days: leadsLast7d,
      previous7Days: leadsPrev7d,
      dailyBreakdown: leadsDaily,
    },
    conversion: {
      rate: Math.round(conversionRate * 100),
    },
    slaHealth: {
      active: slaActive,
      breached: slaBreached,
    },
    avgProjectValue: {
      last90Days: Math.round(avgProjVal90d),
      previous90Days: Math.round(avgProjValPrev90d),
    },
    bookings: {
      next7Days: upcomingBookings.length,
      upcoming: upcomingBookings.slice(0, 3).map((b) => ({
        date: b.date,
        startTime: b.startTime,
        name: b.name,
      })),
    },
    incidents: {
      open:
        (incidentMap.get("critical") ?? 0) +
        (incidentMap.get("warning") ?? 0) +
        (incidentMap.get("info") ?? 0),
      critical: incidentMap.get("critical") ?? 0,
      warning: incidentMap.get("warning") ?? 0,
      info: incidentMap.get("info") ?? 0,
    },
    jobQueue: {
      failed: failedJobs,
      pending: pendingJobs,
    },
    traffic: {
      uniqueVisitors7d: visitors7d.size,
      previousUniqueVisitors7d: visitorsPrev7d.size,
      dailyVisitors: visitorsDaily,
    },
    funnel: {
      steps: funnel,
      overallCompletionRate: Math.round(funnelCompletionRate * 100),
    },
    topSources,
  });
}
