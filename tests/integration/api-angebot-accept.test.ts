import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks (available inside vi.mock factories) ─────────────────────

const { angebotUpdate } = vi.hoisted(() => ({
  angebotUpdate: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    angebot: { findUnique: vi.fn(), update: angebotUpdate },
    submission: { findUnique: vi.fn(), update: vi.fn() },
    promoCode: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    job: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    incident: { create: vi.fn() },
  },
}));

const mockAngebot = {
  id: "ang-test-1",
  submissionId: "sub-test-1",
  version: 1,
  status: "sent",
  createdAt: new Date().toISOString(),
  festpreis: 5000,
  aufwand: 10,
  plan: { phases: [] },
};

const mockSubmission = {
  id: "sub-test-1",
  name: "Max Mustermann",
  email: "max@example.com",
  firma: "TestGmbH",
  beschreibung: "Test project",
  projekttyp: "web",
  funktionen: ["Suche"],
  designLevel: "standard",
  zeitrahmenMvp: "flexibel",
  zeitrahmenFinal: "2-3monate",
  betriebUndWartung: "ja",
};

vi.mock("@/lib/angebote", () => ({
  getAngebotById: vi.fn().mockImplementation(() => ({ ...mockAngebot })),
  updateAngebotStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/submissions", () => ({
  getSubmissionById: vi.fn().mockImplementation(() => ({ ...mockSubmission })),
  updateSubmissionStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/job-queue", () => ({
  enqueueJob: vi.fn().mockResolvedValue(undefined),
  processJobs: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/project-bootstrap", () => ({
  bootstrapProject: vi.fn().mockReturnValue({ success: false }),
}));

vi.mock("@/lib/promo", () => ({
  getPromoDiscountForSubmission: vi.fn().mockResolvedValue(0),
}));

// ─── Import route handler after mocks ───────────────────────────────────────

import { PATCH } from "@/app/api/angebot/[id]/route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/angebot/ang-test-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ id: "ang-test-1" }) };

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PATCH /api/angebot/[id] — Accept mit Betreuung", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    angebotUpdate.mockResolvedValue({});
  });

  it("speichert betreuungMonate bei Annahme", async () => {
    const req = makePatchRequest({ action: "accept", betreuungMonate: 6 });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);

    expect(angebotUpdate).toHaveBeenCalledWith({
      where: { id: "ang-test-1" },
      data: { betreuungMonate: 6 },
    });
  });

  it("gibt betreuungCost im Response zurück (6 Monate = 294 €)", async () => {
    const req = makePatchRequest({ action: "accept", betreuungMonate: 6 });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    expect(body.payment.betreuungMonate).toBe(6);
    expect(body.payment.betreuungCost).toBe(294);
  });

  it("gibt betreuungCost 0 zurück wenn kein Paket gewählt", async () => {
    const req = makePatchRequest({ action: "accept" });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    expect(body.payment.betreuungMonate).toBeNull();
    expect(body.payment.betreuungCost).toBe(0);
  });

  it("berechnet korrekte Betreuungskosten für 12-Monats-Paket (348 €)", async () => {
    const req = makePatchRequest({ action: "accept", betreuungMonate: 12 });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    expect(body.payment.betreuungMonate).toBe(12);
    expect(body.payment.betreuungCost).toBe(348);
  });

  it("berechnet korrekte Betreuungskosten für 3-Monats-Paket (207 €)", async () => {
    const req = makePatchRequest({ action: "accept", betreuungMonate: 3 });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    expect(body.payment.betreuungMonate).toBe(3);
    expect(body.payment.betreuungCost).toBe(207);
  });

  it("Rabatte in options beziehen sich nur auf Festpreis", async () => {
    const req = makePatchRequest({ action: "accept", betreuungMonate: 6 });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    for (const opt of body.payment.options) {
      expect(opt.festpreisOriginal).toBe(5000);
    }

    const fullOpt = body.payment.options.find(
      (o: { type: string }) => o.type === "full"
    );
    expect(fullOpt.amount).toBe(4400); // 5000 * 0.88 — no betreuung
  });

  it("speichert betreuungMonate nicht bei Ablehnung", async () => {
    const req = makePatchRequest({ action: "reject", betreuungMonate: 6 });
    await PATCH(req, routeParams);

    const betreuungUpdateCall = angebotUpdate.mock.calls.find(
      (call: unknown[]) => {
        const arg = call[0] as Record<string, Record<string, unknown>> | undefined;
        return arg?.data && "betreuungMonate" in arg.data;
      }
    );
    expect(betreuungUpdateCall).toBeUndefined();
  });

  it("inkludiert betreuungMonate im Email-Job-Payload", async () => {
    const { enqueueJob } = await import("@/lib/job-queue");
    const req = makePatchRequest({ action: "accept", betreuungMonate: 12 });
    await PATCH(req, routeParams);

    expect(enqueueJob).toHaveBeenCalledWith(
      "angebot_accepted_email",
      expect.objectContaining({ betreuungMonate: 12 }),
      5,
      expect.any(String)
    );
  });
});
