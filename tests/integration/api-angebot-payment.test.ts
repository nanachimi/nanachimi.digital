import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────��────────────────────────────��───────────────────

const { paymentCreate, mockCreateCheckoutSession, mockGetAngebotById } =
  vi.hoisted(() => ({
    paymentCreate: vi.fn().mockResolvedValue({}),
    mockCreateCheckoutSession: vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.com/test",
      sessionId: "cs_test_123",
    }),
    mockGetAngebotById: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: { create: paymentCreate, findFirst: vi.fn().mockResolvedValue(null) },
    promoCode: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    submission: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/stripe", () => ({
  createCheckoutSession: (...args: unknown[]) =>
    mockCreateCheckoutSession(...args),
  isStripeConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/angebote", () => ({
  getAngebotById: (...args: unknown[]) => mockGetAngebotById(...args),
}));

vi.mock("@/lib/submissions", () => ({
  getSubmissionById: vi.fn().mockResolvedValue({
    id: "sub-1",
    email: "max@example.com",
    name: "Max Mustermann",
  }),
}));

vi.mock("@/lib/promo", () => ({
  getPromoDiscountForSubmission: vi.fn().mockResolvedValue(0),
}));

// ─── Import route handler after mocks ─────────────────��─────────────────────

import { POST } from "@/app/api/angebot/[id]/payment/route";

// ──��� Helpers ─��──────────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/angebot/ang-1/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ id: "ang-1" }) };

function acceptedAngebot(overrides: Record<string, unknown> = {}) {
  return {
    id: "ang-1",
    submissionId: "sub-1",
    version: 1,
    status: "accepted",
    createdAt: new Date().toISOString(),
    festpreis: 5000,
    aufwand: 10,
    plan: { phases: [] },
    betreuungMonate: undefined,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/angebot/[id]/payment — Betreuung im Gesamtbetrag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentCreate.mockResolvedValue({});
    mockCreateCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
      sessionId: "cs_test_123",
    });
  });

  it("addiert Betreuungskosten zum Payment-Betrag (full, 6 Monate)", async () => {
    mockGetAngebotById.mockResolvedValue(
      acceptedAngebot({ betreuungMonate: 6 })
    );
    const req = makePostRequest({ type: "full" });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    // full payment: 5000 * 0.88 = 4400. Betreuung: 6 * 49 = 294.
    // Total: (4400 + 294) * 100 = 469400 cents
    expect(paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 469400,
      }),
    });
  });

  it("addiert Betreuungskosten zum Payment-Betrag (half, 12 Monate)", async () => {
    mockGetAngebotById.mockResolvedValue(
      acceptedAngebot({ betreuungMonate: 12 })
    );
    const req = makePostRequest({ type: "half" });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    // half payment: 5000 * 0.95 = 4750, 50% = 2375. Betreuung: 12 * 29 = 348.
    // Total: (2375 + 348) * 100 = 272300 cents
    expect(paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 272300,
      }),
    });
  });

  it("Payment ohne Betreuung enthält nur Projektbetrag", async () => {
    mockGetAngebotById.mockResolvedValue(acceptedAngebot());
    const req = makePostRequest({ type: "full" });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    // full: 5000 * 0.88 = 4400. No betreuung. Total: 4400 * 100 = 440000 cents
    expect(paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 440000,
      }),
    });
  });

  it("übergibt betreuungMonate und betreuungCost an createCheckoutSession", async () => {
    mockGetAngebotById.mockResolvedValue(
      acceptedAngebot({ betreuungMonate: 6 })
    );
    const req = makePostRequest({ type: "full" });
    await POST(req, routeParams);

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        betreuungMonate: 6,
        betreuungCost: 294,
      })
    );
  });

  it("übergibt keine Betreuung an Stripe wenn kein Paket gewählt", async () => {
    mockGetAngebotById.mockResolvedValue(acceptedAngebot());
    const req = makePostRequest({ type: "full" });
    await POST(req, routeParams);

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        betreuungMonate: undefined,
        betreuungCost: undefined,
      })
    );
  });

  it("discount-Feld enthält nur Zahlungsrabatt, nicht Betreuung", async () => {
    mockGetAngebotById.mockResolvedValue(
      acceptedAngebot({ betreuungMonate: 6 })
    );
    const req = makePostRequest({ type: "full" });
    await POST(req, routeParams);

    // full payment discount: 5000 * 0.12 = 600. In cents: 60000
    expect(paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        discount: 60000,
      }),
    });
  });

  it("tranche_1 mit 3-Monats-Betreuung (keine Rabatte auf Projekt)", async () => {
    mockGetAngebotById.mockResolvedValue(
      acceptedAngebot({ betreuungMonate: 3 })
    );
    const req = makePostRequest({ type: "tranche_1" });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    // tranche_1: 15% of 5000 (no discount) = 750. Betreuung: 3 * 69 = 207.
    // Total: (750 + 207) * 100 = 95700 cents
    expect(paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 95700,
      }),
    });
  });
});
