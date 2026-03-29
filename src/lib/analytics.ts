/**
 * Analytics store — persisted in PostgreSQL via Prisma.
 *
 * Tracks page views, onboarding funnel events, and conversions.
 */

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageView {
  id: string;
  visitorId: string;
  ip?: string;
  path: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp: string;
  timeOnPage?: number; // seconds
  scrollDepth?: number; // 0-100
}

export interface OnboardingEvent {
  id: string;
  visitorId: string;
  ip?: string;
  sessionId: string;
  step: number;
  stepName: string;
  type: "step_enter" | "step_complete" | "abandon" | "funnel_complete";
  duration?: number; // seconds spent on step
  timestamp: string;
}

export interface ConversionEvent {
  id: string;
  visitorId: string;
  ip?: string;
  type: "cta_click" | "conversion_path";
  ctaId?: string; // e.g., "hero_primary", "urgency_cta"
  conversionPath?: string; // "call" or "angebot"
  page: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Aggregated stats
// ---------------------------------------------------------------------------

export interface AggregatedStats {
  pageViews: {
    total: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    topPages: { path: string; views: number; avgTime: number }[];
  };
  trafficSources: { source: string; count: number }[];
  onboardingFunnel: {
    stepName: string;
    step: number;
    entries: number;
    completions: number;
    avgDuration: number;
    dropOff: number;
  }[];
  conversions: {
    totalCtaClicks: number;
    conversionRate: number; // visitors who reached action / total visitors
    callVsAngebot: { call: number; angebot: number };
  };
}

// ---------------------------------------------------------------------------
// Page views
// ---------------------------------------------------------------------------

export async function addPageView(pv: PageView): Promise<void> {
  await prisma.pageView.create({
    data: {
      id: pv.id,
      visitorId: pv.visitorId,
      ip: pv.ip ?? null,
      path: pv.path,
      referrer: pv.referrer,
      utmSource: pv.utmSource ?? null,
      utmMedium: pv.utmMedium ?? null,
      utmCampaign: pv.utmCampaign ?? null,
      timeOnPage: pv.timeOnPage ?? null,
      scrollDepth: pv.scrollDepth ?? null,
    },
  });
}

export async function updatePageView(
  id: string,
  updates: Partial<Pick<PageView, "timeOnPage" | "scrollDepth">>
): Promise<void> {
  try {
    const data: Record<string, unknown> = {};
    if (updates.timeOnPage !== undefined) data.timeOnPage = updates.timeOnPage;
    if (updates.scrollDepth !== undefined) data.scrollDepth = updates.scrollDepth;
    await prisma.pageView.update({ where: { id }, data });
  } catch {
    // Silently ignore if record not found (e.g., expired)
  }
}

// ---------------------------------------------------------------------------
// Onboarding events
// ---------------------------------------------------------------------------

export async function addOnboardingEvent(event: OnboardingEvent): Promise<void> {
  await prisma.onboardingAnalyticsEvent.create({
    data: {
      id: event.id,
      visitorId: event.visitorId,
      ip: event.ip ?? null,
      sessionId: event.sessionId,
      step: event.step,
      stepName: event.stepName,
      type: event.type,
      duration: event.duration ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Conversion events
// ---------------------------------------------------------------------------

export async function addConversionEvent(event: ConversionEvent): Promise<void> {
  await prisma.conversionEvent.create({
    data: {
      id: event.id,
      visitorId: event.visitorId,
      ip: event.ip ?? null,
      type: event.type,
      ctaId: event.ctaId ?? null,
      conversionPath: event.conversionPath ?? null,
      page: event.page,
    },
  });
}

// ---------------------------------------------------------------------------
// Stats aggregation
// ---------------------------------------------------------------------------

export async function getAggregatedStats(): Promise<AggregatedStats> {
  // Load excluded IPs for retroactive filtering
  const excludedIpRecords = await prisma.excludedIp.findMany();
  const excludedIps = new Set(excludedIpRecords.map((r) => r.ip));

  // Build Prisma filter: exclude records whose IP is in the excluded set
  // Records without IP (ip IS NULL) are always included (legacy data before IP tracking)
  const excludedIpArray = Array.from(excludedIps);
  const ipFilter = excludedIpArray.length > 0
    ? { OR: [{ ip: { equals: null } }, { ip: { notIn: excludedIpArray } }] }
    : {};

  // --- Page views ---
  const allPVs = await prisma.pageView.findMany({ where: ipFilter });
  const totalPV = allPVs.length;
  const uniqueVisitors = new Set(allPVs.map((p) => p.visitorId)).size;
  const pvWithTime = allPVs.filter((p) => p.timeOnPage != null);
  const avgTimeOnPage =
    pvWithTime.length > 0
      ? pvWithTime.reduce((s, p) => s + (p.timeOnPage ?? 0), 0) / pvWithTime.length
      : 0;

  // Top pages
  const pageMap = new Map<string, { views: number; totalTime: number; timeCount: number }>();
  for (const pv of allPVs) {
    const entry = pageMap.get(pv.path) ?? { views: 0, totalTime: 0, timeCount: 0 };
    entry.views++;
    if (pv.timeOnPage != null) {
      entry.totalTime += pv.timeOnPage;
      entry.timeCount++;
    }
    pageMap.set(pv.path, entry);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([path, d]) => ({
      path,
      views: d.views,
      avgTime: d.timeCount > 0 ? d.totalTime / d.timeCount : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  // --- Traffic sources ---
  const sourceMap = new Map<string, number>();
  for (const pv of allPVs) {
    const source = pv.utmSource || pv.referrer || "direkt";
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  }
  const trafficSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // --- Onboarding funnel ---
  const allEvents = await prisma.onboardingAnalyticsEvent.findMany({ where: ipFilter });
  const stepMap = new Map<
    number,
    { stepName: string; entries: number; completions: number; totalDuration: number; durationCount: number }
  >();
  for (const ev of allEvents) {
    const entry = stepMap.get(ev.step) ?? {
      stepName: ev.stepName,
      entries: 0,
      completions: 0,
      totalDuration: 0,
      durationCount: 0,
    };
    if (ev.type === "step_enter") entry.entries++;
    if (ev.type === "step_complete") {
      entry.completions++;
      if (ev.duration != null) {
        entry.totalDuration += ev.duration;
        entry.durationCount++;
      }
    }
    stepMap.set(ev.step, entry);
  }
  const onboardingFunnel = Array.from(stepMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([step, d]) => ({
      step,
      stepName: d.stepName,
      entries: d.entries,
      completions: d.completions,
      avgDuration: d.durationCount > 0 ? d.totalDuration / d.durationCount : 0,
      dropOff: d.entries > 0 ? 1 - d.completions / d.entries : 0,
    }));

  // --- Conversions ---
  const allConversions = await prisma.conversionEvent.findMany({ where: ipFilter });
  const totalCtaClicks = allConversions.filter((e) => e.type === "cta_click").length;
  const pathEvents = allConversions.filter((e) => e.type === "conversion_path");
  const callCount = pathEvents.filter((e) => e.conversionPath === "call").length;
  const angebotCount = pathEvents.filter((e) => e.conversionPath === "angebot").length;
  const conversionRate = uniqueVisitors > 0 ? pathEvents.length / uniqueVisitors : 0;

  return {
    pageViews: { total: totalPV, uniqueVisitors, avgTimeOnPage, topPages },
    trafficSources,
    onboardingFunnel,
    conversions: {
      totalCtaClicks,
      conversionRate,
      callVsAngebot: { call: callCount, angebot: angebotCount },
    },
  };
}
