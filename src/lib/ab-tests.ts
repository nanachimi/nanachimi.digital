/**
 * A/B test store — persisted in PostgreSQL via Prisma.
 *
 * Stores test definitions, variant assignments, and tracking events.
 */

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ABTestVariant {
  id: string; // e.g., "control", "variant-a"
  label: string; // Human-readable: "Original", "Neuer CTA-Text"
  config: Record<string, string>; // Key-value pairs the component reads
  weight: number; // Traffic percentage (0–100), all variants must sum to 100
}

export interface ABTest {
  id: string;
  name: string; // "Hero CTA Text Test"
  targetElement: string; // Matches element registry key, e.g., "hero-cta"
  status: "draft" | "running" | "paused" | "completed";
  variants: ABTestVariant[];
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

export interface ABEvent {
  id: string;
  testId: string;
  variantId: string;
  visitorId: string; // From ncd-ab cookie
  type: "impression" | "conversion";
  conversionType?: string; // "cta_click" | "onboarding_start" | "booking"
  page?: string; // URL path where event occurred
  createdAt: string;
}

export interface ABTestStats {
  variantId: string;
  variantLabel: string;
  impressions: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number; // 0–1
}

// ─── Helpers ──────────────────────────────────────────────────────

function dbToTest(r: Record<string, unknown>): ABTest {
  return {
    id: r.id as string,
    name: r.name as string,
    targetElement: r.targetElement as string,
    status: r.status as ABTest["status"],
    variants: r.variants as ABTestVariant[],
    createdAt: (r.createdAt as Date).toISOString(),
    startedAt: r.startedAt ? (r.startedAt as Date).toISOString() : undefined,
    pausedAt: r.pausedAt ? (r.pausedAt as Date).toISOString() : undefined,
    completedAt: r.completedAt ? (r.completedAt as Date).toISOString() : undefined,
  };
}

function dbToEvent(r: Record<string, unknown>): ABEvent {
  return {
    id: r.id as string,
    testId: r.testId as string,
    variantId: r.variantId as string,
    visitorId: r.visitorId as string,
    type: r.type as "impression" | "conversion",
    conversionType: (r.conversionType as string) || undefined,
    page: (r.page as string) || undefined,
    createdAt: (r.createdAt as Date).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Test CRUD
// ---------------------------------------------------------------------------

export async function getAllTests(): Promise<ABTest[]> {
  const rows = await prisma.aBTest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => dbToTest(r as unknown as Record<string, unknown>));
}

export async function getTestById(id: string): Promise<ABTest | undefined> {
  const r = await prisma.aBTest.findUnique({ where: { id } });
  if (!r) return undefined;
  return dbToTest(r as unknown as Record<string, unknown>);
}

export async function getTestByTarget(targetElement: string): Promise<ABTest | undefined> {
  const r = await prisma.aBTest.findFirst({
    where: { targetElement, status: "running" },
  });
  if (!r) return undefined;
  return dbToTest(r as unknown as Record<string, unknown>);
}

export async function getRunningTests(): Promise<ABTest[]> {
  const rows = await prisma.aBTest.findMany({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => dbToTest(r as unknown as Record<string, unknown>));
}

export async function createTest(test: ABTest): Promise<void> {
  await prisma.aBTest.create({
    data: {
      id: test.id,
      name: test.name,
      targetElement: test.targetElement,
      status: test.status,
      variants: JSON.parse(JSON.stringify(test.variants)),
      startedAt: test.startedAt ? new Date(test.startedAt) : null,
      pausedAt: test.pausedAt ? new Date(test.pausedAt) : null,
      completedAt: test.completedAt ? new Date(test.completedAt) : null,
    },
  });
}

export async function updateTest(
  id: string,
  updates: Partial<Omit<ABTest, "id">>
): Promise<ABTest | undefined> {
  try {
    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.targetElement !== undefined) data.targetElement = updates.targetElement;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.variants !== undefined) data.variants = JSON.parse(JSON.stringify(updates.variants));
    if (updates.startedAt !== undefined) data.startedAt = updates.startedAt ? new Date(updates.startedAt) : null;
    if (updates.pausedAt !== undefined) data.pausedAt = updates.pausedAt ? new Date(updates.pausedAt) : null;
    if (updates.completedAt !== undefined) data.completedAt = updates.completedAt ? new Date(updates.completedAt) : null;

    const r = await prisma.aBTest.update({ where: { id }, data });
    return dbToTest(r as unknown as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export async function deleteTest(id: string): Promise<boolean> {
  try {
    await prisma.$transaction([
      prisma.aBEvent.deleteMany({ where: { testId: id } }),
      prisma.aBTest.delete({ where: { id } }),
    ]);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Event tracking
// ---------------------------------------------------------------------------

export async function addEvent(event: ABEvent): Promise<boolean> {
  // Deduplicate impressions: one impression per visitor per test
  if (event.type === "impression") {
    const exists = await prisma.aBEvent.findFirst({
      where: {
        type: "impression",
        testId: event.testId,
        visitorId: event.visitorId,
      },
    });
    if (exists) return false;
  }

  await prisma.aBEvent.create({
    data: {
      id: event.id,
      testId: event.testId,
      variantId: event.variantId,
      visitorId: event.visitorId,
      type: event.type,
      conversionType: event.conversionType ?? null,
      page: event.page ?? null,
    },
  });
  return true;
}

export async function getEventsByTest(testId: string): Promise<ABEvent[]> {
  const rows = await prisma.aBEvent.findMany({ where: { testId } });
  return rows.map((r) => dbToEvent(r as unknown as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Stats aggregation
// ---------------------------------------------------------------------------

export async function getTestStats(testId: string): Promise<ABTestStats[]> {
  const test = await getTestById(testId);
  if (!test) return [];

  const events = await getEventsByTest(testId);

  return test.variants.map((variant) => {
    const variantEvents = events.filter((e) => e.variantId === variant.id);
    const impressions = variantEvents.filter(
      (e) => e.type === "impression"
    ).length;
    const uniqueVisitors = new Set(
      variantEvents
        .filter((e) => e.type === "impression")
        .map((e) => e.visitorId)
    ).size;
    const conversions = variantEvents.filter(
      (e) => e.type === "conversion"
    ).length;
    const conversionRate = uniqueVisitors > 0 ? conversions / uniqueVisitors : 0;

    return {
      variantId: variant.id,
      variantLabel: variant.label,
      impressions,
      uniqueVisitors,
      conversions,
      conversionRate,
    };
  });
}

// ---------------------------------------------------------------------------
// Variant assignment (deterministic hash — pure, no DB)
// ---------------------------------------------------------------------------

export function assignVariant(
  visitorId: string,
  testId: string,
  variants: ABTestVariant[]
): string {
  // Simple string hash for deterministic assignment
  const str = visitorId + ":" + testId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100; // 0–99

  // Walk through weighted buckets
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.id;
  }
  return variants[variants.length - 1].id; // Fallback
}
