import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks & env ────────────────────────────────────────────────────

const { sessionsCreate } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
}));

// Mock the stripe module — vi.mock is hoisted so this runs before imports
vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = {
      sessions: { create: sessionsCreate },
    };
  },
}));

// Defensive mock for Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    promoCode: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    submission: { findUnique: vi.fn() },
  },
}));

// ─── Import after mocks ─────────────────────────────────────────────────────

// We need to dynamically import stripe.ts AFTER setting env so getStripe() works.
// stripe.ts captures `const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY`
// at module level, so we must set it before the module loads.

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("createCheckoutSession — Stripe Line Items", () => {
  // Use dynamic import to control when stripe.ts loads
  let createCheckoutSession: typeof import("@/lib/stripe")["createCheckoutSession"];

  beforeEach(async () => {
    sessionsCreate.mockReset();
    sessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/test_session",
      id: "cs_test_456",
    });

    // Set env before module loads
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

    // Re-import to pick up env changes (vitest caches modules, so first import sticks)
    const mod = await import("@/lib/stripe");
    createCheckoutSession = mod.createCheckoutSession;
  });

  it("erstellt zwei Line Items wenn Betreuung gewählt", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
      betreuungMonate: 6,
      betreuungCost: 294,
    });

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const args = sessionsCreate.mock.calls[0][0];

    expect(args.line_items).toHaveLength(2);
    expect(args.line_items[0].price_data.product_data.name).toContain("Projektzahlung");
    expect(args.line_items[0].price_data.unit_amount).toBe(440000);
    expect(args.line_items[1].price_data.product_data.name).toBe("Betrieb & Wartung — 6 Monate");
    expect(args.line_items[1].price_data.unit_amount).toBe(29400);
  });

  it("erstellt nur einen Line Item ohne Betreuung", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
    });

    const args = sessionsCreate.mock.calls[0][0];
    expect(args.line_items).toHaveLength(1);
    expect(args.line_items[0].price_data.product_data.name).toContain("Projektzahlung");
  });

  it("Betreuungs-Line-Item hat festen Preis (keine Rabatte)", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
      promoDiscount: 0.25,
      betreuungMonate: 12,
      betreuungCost: 348,
    });

    const args = sessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(315000);
    expect(args.line_items[1].price_data.unit_amount).toBe(34800);
    expect(args.line_items[1].price_data.product_data.name).toBe("Betrieb & Wartung — 12 Monate");
  });

  it("metadata enthält betreuungMonate und betreuungCost", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
      betreuungMonate: 6,
      betreuungCost: 294,
    });

    const args = sessionsCreate.mock.calls[0][0];
    expect(args.metadata.betreuungMonate).toBe("6");
    expect(args.metadata.betreuungCost).toBe("294");
  });

  it("metadata enthält keine Betreuung wenn nicht gewählt", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
    });

    const args = sessionsCreate.mock.calls[0][0];
    expect(args.metadata).not.toHaveProperty("betreuungMonate");
    expect(args.metadata).not.toHaveProperty("betreuungCost");
  });

  it("Betreuungs-Line-Item hat korrekte Beschreibung", async () => {
    await createCheckoutSession({
      angebotId: "ang-1",
      festpreis: 5000,
      paymentType: "full",
      betreuungMonate: 3,
      betreuungCost: 207,
    });

    const args = sessionsCreate.mock.calls[0][0];
    expect(args.line_items[1].price_data.product_data.description).toContain("3 Monate");
    expect(args.line_items[1].price_data.unit_amount).toBe(20700);
  });
});
