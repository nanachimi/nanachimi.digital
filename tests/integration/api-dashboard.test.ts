import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — available inside vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockSubmissions,
  mockPayments30d,
  mockPaymentsPrev,
  mockPendingPayments,
  mockSentAngebote,
  mockLeads14d,
  mockStatusCounts,
  mockSlaActive,
  mockSlaBreached,
  mockAcceptedAngebote,
  mockAcceptedPrev,
  mockBookings,
  mockIncidents,
  mockFailedJobs,
  mockPendingJobs,
  mockPageViews,
  mockFunnelEvents,
  mockExcludedIps,
} = vi.hoisted(() => ({
  mockSubmissions: vi.fn(),
  mockPayments30d: vi.fn(),
  mockPaymentsPrev: vi.fn(),
  mockPendingPayments: vi.fn(),
  mockSentAngebote: vi.fn(),
  mockLeads14d: vi.fn(),
  mockStatusCounts: vi.fn(),
  mockSlaActive: vi.fn(),
  mockSlaBreached: vi.fn(),
  mockAcceptedAngebote: vi.fn(),
  mockAcceptedPrev: vi.fn(),
  mockBookings: vi.fn(),
  mockIncidents: vi.fn(),
  mockFailedJobs: vi.fn(),
  mockPendingJobs: vi.fn(),
  mockPageViews: vi.fn(),
  mockFunnelEvents: vi.fn(),
  mockExcludedIps: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ isLoggedIn: true }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    excludedIp: { findMany: mockExcludedIps },
    submission: {
      findMany: vi.fn().mockImplementation((args: { where?: { status?: unknown; createdAt?: unknown } }) => {
        if (args?.where?.createdAt) return mockLeads14d();
        return mockSubmissions();
      }),
      groupBy: mockStatusCounts,
      count: vi.fn().mockImplementation((args: { where?: { status?: string } }) => {
        if (args?.where?.status === "sla_active") return mockSlaActive();
        if (args?.where?.status === "sla_breached") return mockSlaBreached();
        return 0;
      }),
    },
    payment: {
      findMany: mockPayments30d,
      aggregate: vi.fn().mockImplementation((args: { where?: { status?: string } }) => {
        if (args?.where?.status === "paid") return mockPaymentsPrev();
        return mockPendingPayments();
      }),
    },
    angebot: {
      findMany: vi.fn().mockImplementation((args: { where?: { status?: string; createdAt?: unknown } }) => {
        if (args?.where?.status === "sent") return mockSentAngebote();
        // Accepted angebote: check for lt property (prev period)
        if (args?.where?.createdAt && typeof args.where.createdAt === "object" && "lt" in args.where.createdAt) {
          return mockAcceptedPrev();
        }
        return mockAcceptedAngebote();
      }),
    },
    booking: { findMany: mockBookings },
    incident: { groupBy: mockIncidents },
    job: {
      count: vi.fn().mockImplementation((args: { where?: { status?: string } }) => {
        if (args?.where?.status === "failed") return mockFailedJobs();
        return mockPendingJobs();
      }),
    },
    pageView: { findMany: mockPageViews },
    onboardingAnalyticsEvent: { findMany: mockFunnelEvents },
  },
}));

// Import route handler after mocks
import { GET } from "@/app/api/admin/dashboard/route";

// ---------------------------------------------------------------------------
// Default mock return values
// ---------------------------------------------------------------------------

function setupDefaults() {
  mockExcludedIps.mockResolvedValue([]);

  mockSubmissions.mockResolvedValue([
    { estimate: { festpreis: 5000 } },
    { estimate: { festpreis: 3000 } },
    { estimate: null },
  ]);

  mockPayments30d.mockResolvedValue([
    { amount: 2000, paidAt: new Date() },
    { amount: 1500, paidAt: new Date() },
  ]);

  mockPaymentsPrev.mockResolvedValue({ _sum: { amount: 2500 } });

  mockPendingPayments.mockResolvedValue({
    _sum: { amount: 800 },
    _count: 2,
  });

  mockSentAngebote.mockResolvedValue([
    { festpreis: 4000 },
    { festpreis: 1500 },
  ]);

  const now = new Date();
  const d3 = new Date(Date.now() - 3 * 86400000);
  const d10 = new Date(Date.now() - 10 * 86400000);
  mockLeads14d.mockResolvedValue([
    { createdAt: now },
    { createdAt: now },
    { createdAt: d3 },
    { createdAt: d10 },
  ]);

  mockStatusCounts.mockResolvedValue([
    { status: "accepted", _count: 3 },
    { status: "rejected_by_client", _count: 2 },
    { status: "angebot_sent", _count: 5 },
    { status: "pending", _count: 10 },
  ]);

  mockSlaActive.mockResolvedValue(2);
  mockSlaBreached.mockResolvedValue(1);

  mockAcceptedAngebote.mockResolvedValue([
    { festpreis: 5000 },
    { festpreis: 3000 },
  ]);
  mockAcceptedPrev.mockResolvedValue([
    { festpreis: 2000 },
  ]);

  mockBookings.mockResolvedValue([
    { date: "2026-04-14", startTime: "10:00", name: "Max Mustermann" },
  ]);

  mockIncidents.mockResolvedValue([
    { severity: "warning", _count: 5 },
    { severity: "info", _count: 3 },
  ]);

  mockFailedJobs.mockResolvedValue(2);
  mockPendingJobs.mockResolvedValue(4);

  mockPageViews.mockResolvedValue([
    { visitorId: "v1", timestamp: now, referrer: null, utmSource: null },
    { visitorId: "v2", timestamp: now, referrer: "google.com", utmSource: null },
    { visitorId: "v1", timestamp: d3, referrer: null, utmSource: null },
  ]);

  mockFunnelEvents.mockResolvedValue([
    { step: 1, stepName: "Projekttyp", type: "step_enter", duration: 0 },
    { step: 1, stepName: "Projekttyp", type: "step_complete", duration: 5000 },
    { step: 2, stepName: "Beschreibung", type: "step_enter", duration: 0 },
    { step: 2, stepName: "Beschreibung", type: "step_complete", duration: 8000 },
    { step: 1, stepName: "Projekttyp", type: "step_enter", duration: 0 },
    { step: 1, stepName: "Projekttyp", type: "funnel_complete", duration: 0 },
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns 200 with all KPI groups", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("pipeline");
    expect(body).toHaveProperty("revenue");
    expect(body).toHaveProperty("pendingPayments");
    expect(body).toHaveProperty("openOffers");
    expect(body).toHaveProperty("newLeads");
    expect(body).toHaveProperty("conversion");
    expect(body).toHaveProperty("slaHealth");
    expect(body).toHaveProperty("avgProjectValue");
    expect(body).toHaveProperty("bookings");
    expect(body).toHaveProperty("incidents");
    expect(body).toHaveProperty("jobQueue");
    expect(body).toHaveProperty("traffic");
    expect(body).toHaveProperty("funnel");
    expect(body).toHaveProperty("topSources");
  });

  it("computes pipeline totalValue from estimates", async () => {
    const res = await GET();
    const body = await res.json();

    // 5000 + 3000 = 8000, null estimate skipped
    expect(body.pipeline.totalValue).toBe(8000);
    expect(body.pipeline.count).toBe(3);
  });

  it("computes revenue from paid payments", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.revenue.last30Days).toBe(3500); // 2000 + 1500
    expect(body.revenue.previous30Days).toBe(2500);
    expect(body.revenue.dailyBreakdown).toBeInstanceOf(Array);
    expect(body.revenue.dailyBreakdown.length).toBe(30);
  });

  it("returns pending payments aggregation", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.pendingPayments.totalValue).toBe(800);
    expect(body.pendingPayments.count).toBe(2);
  });

  it("sums open offers festpreis", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.openOffers.totalValue).toBe(5500); // 4000 + 1500
    expect(body.openOffers.count).toBe(2);
  });

  it("counts new leads with 7-day split", async () => {
    const res = await GET();
    const body = await res.json();

    // 3 leads within 7 days (now, now, d3), 1 lead at d10 (prev 7d)
    expect(body.newLeads.last7Days).toBe(3);
    expect(body.newLeads.previous7Days).toBe(1);
    expect(body.newLeads.dailyBreakdown).toHaveLength(14);
  });

  it("calculates conversion rate", async () => {
    const res = await GET();
    const body = await res.json();

    // accepted(3) / (accepted(3) + rejected(2) + sent(5)) = 3/10 = 30%
    expect(body.conversion.rate).toBe(30);
  });

  it("returns SLA health counts", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.slaHealth.active).toBe(2);
    expect(body.slaHealth.breached).toBe(1);
  });

  it("computes average project value", async () => {
    const res = await GET();
    const body = await res.json();

    // (5000 + 3000) / 2 = 4000
    expect(body.avgProjectValue.last90Days).toBe(4000);
    // 2000 / 1 = 2000
    expect(body.avgProjectValue.previous90Days).toBe(2000);
  });

  it("returns upcoming bookings", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.bookings.next7Days).toBe(1);
    expect(body.bookings.upcoming).toHaveLength(1);
    expect(body.bookings.upcoming[0].name).toBe("Max Mustermann");
  });

  it("aggregates incidents by severity", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.incidents.open).toBe(8); // 5 + 3
    expect(body.incidents.warning).toBe(5);
    expect(body.incidents.info).toBe(3);
    expect(body.incidents.critical).toBe(0);
  });

  it("returns job queue counts", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.jobQueue.failed).toBe(2);
    expect(body.jobQueue.pending).toBe(4);
  });

  it("computes unique visitors and daily breakdown", async () => {
    const res = await GET();
    const body = await res.json();

    // v1 and v2 are both within last 7 days
    expect(body.traffic.uniqueVisitors7d).toBeGreaterThanOrEqual(1);
    expect(body.traffic.dailyVisitors).toHaveLength(30);
  });

  it("includes top traffic sources", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.topSources).toBeInstanceOf(Array);
    expect(body.topSources.length).toBeGreaterThanOrEqual(1);
    expect(body.topSources[0]).toHaveProperty("source");
    expect(body.topSources[0]).toHaveProperty("count");
  });

  it("includes funnel data with completion rate", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.funnel.steps).toBeInstanceOf(Array);
    expect(body.funnel.steps.length).toBeGreaterThanOrEqual(1);
    expect(body.funnel.overallCompletionRate).toBeGreaterThanOrEqual(0);
    expect(body.funnel.overallCompletionRate).toBeLessThanOrEqual(100);
  });

  it("returns 401 when not authenticated", async () => {
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("UNAUTHORIZED"));

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("handles empty data gracefully", async () => {
    mockSubmissions.mockResolvedValue([]);
    mockPayments30d.mockResolvedValue([]);
    mockPaymentsPrev.mockResolvedValue({ _sum: { amount: null } });
    mockPendingPayments.mockResolvedValue({ _sum: { amount: null }, _count: 0 });
    mockSentAngebote.mockResolvedValue([]);
    mockLeads14d.mockResolvedValue([]);
    mockStatusCounts.mockResolvedValue([]);
    mockSlaActive.mockResolvedValue(0);
    mockSlaBreached.mockResolvedValue(0);
    mockAcceptedAngebote.mockResolvedValue([]);
    mockAcceptedPrev.mockResolvedValue([]);
    mockBookings.mockResolvedValue([]);
    mockIncidents.mockResolvedValue([]);
    mockFailedJobs.mockResolvedValue(0);
    mockPendingJobs.mockResolvedValue(0);
    mockPageViews.mockResolvedValue([]);
    mockFunnelEvents.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pipeline.totalValue).toBe(0);
    expect(body.pipeline.count).toBe(0);
    expect(body.revenue.last30Days).toBe(0);
    expect(body.revenue.previous30Days).toBe(0);
    expect(body.pendingPayments.totalValue).toBe(0);
    expect(body.openOffers.totalValue).toBe(0);
    expect(body.newLeads.last7Days).toBe(0);
    expect(body.conversion.rate).toBe(0);
    expect(body.avgProjectValue.last90Days).toBe(0);
    expect(body.bookings.next7Days).toBe(0);
    expect(body.incidents.open).toBe(0);
    expect(body.jobQueue.failed).toBe(0);
    expect(body.traffic.uniqueVisitors7d).toBe(0);
    expect(body.funnel.overallCompletionRate).toBe(0);
    expect(body.topSources).toHaveLength(0);
  });

  it("revenue daily breakdown sums per day correctly", async () => {
    const today = new Date();
    mockPayments30d.mockResolvedValue([
      { amount: 100, paidAt: today },
      { amount: 200, paidAt: today },
      { amount: 50, paidAt: today },
    ]);

    const res = await GET();
    const body = await res.json();

    const todayKey = today.toISOString().slice(0, 10);
    const todayEntry = body.revenue.dailyBreakdown.find(
      (d: { date: string }) => d.date === todayKey,
    );
    expect(todayEntry?.value).toBe(350);
  });
});
