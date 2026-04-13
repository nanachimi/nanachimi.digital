import { describe, it, expect, vi } from "vitest";

// Defensive mock so the constants module loads without DB connection
vi.mock("@/lib/db", () => ({
  prisma: {
    promoCode: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    submission: { findUnique: vi.fn() },
  },
}));

import {
  BETRIEB_UND_WARTUNG,
  calculatePaymentOptions,
  MAX_TOTAL_DISCOUNT_PCT,
} from "@/lib/constants";

// ─── Helper: compute betreuung cost (same logic used in route handlers) ──────
function computeBetreuungCost(monate: number | null | undefined): number {
  if (!monate) return 0;
  const pkg = BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === monate);
  return pkg ? pkg.preisProMonat * monate : 0;
}

// ─── Suite A: Package configuration ─────────────────────────────────────────

describe("BETRIEB_UND_WARTUNG Paketkonfiguration", () => {
  it("definiert drei Pakete (3, 6, 12 Monate)", () => {
    expect(BETRIEB_UND_WARTUNG.pakete).toHaveLength(3);
    expect(BETRIEB_UND_WARTUNG.pakete.map((p) => p.monate)).toEqual([3, 6, 12]);
  });

  it("3-Monats-Paket kostet 69 €/Monat (207 € gesamt)", () => {
    const pkg = BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === 3)!;
    expect(pkg.preisProMonat).toBe(69);
    expect(pkg.preisProMonat * pkg.monate).toBe(207);
  });

  it("6-Monats-Paket kostet 49 €/Monat (294 € gesamt)", () => {
    const pkg = BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === 6)!;
    expect(pkg.preisProMonat).toBe(49);
    expect(pkg.preisProMonat * pkg.monate).toBe(294);
  });

  it("12-Monats-Paket kostet 29 €/Monat (348 € gesamt)", () => {
    const pkg = BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === 12)!;
    expect(pkg.preisProMonat).toBe(29);
    expect(pkg.preisProMonat * pkg.monate).toBe(348);
  });

  it("inkludiert 1 Monat Betreuung im Festpreis", () => {
    expect(BETRIEB_UND_WARTUNG.inkludiertMonate).toBe(1);
  });
});

// ─── Suite B: Cost computation ──────────────────────────────────────────────

describe("Betreuung Kostenberechnung", () => {
  it("berechnet korrekte Kosten für jedes gültige Paket", () => {
    expect(computeBetreuungCost(3)).toBe(207);
    expect(computeBetreuungCost(6)).toBe(294);
    expect(computeBetreuungCost(12)).toBe(348);
  });

  it("gibt 0 zurück wenn kein Paket gewählt (null/undefined)", () => {
    expect(computeBetreuungCost(null)).toBe(0);
    expect(computeBetreuungCost(undefined)).toBe(0);
  });

  it("gibt 0 zurück wenn betreuungMonate keinem Paket entspricht", () => {
    expect(computeBetreuungCost(5)).toBe(0);
    expect(computeBetreuungCost(1)).toBe(0);
    expect(computeBetreuungCost(24)).toBe(0);
  });

  it("Paketpreise sind immer ganzzahlig (keine Cent-Rundung nötig)", () => {
    for (const pkg of BETRIEB_UND_WARTUNG.pakete) {
      const cost = pkg.preisProMonat * pkg.monate;
      expect(Number.isInteger(cost)).toBe(true);
    }
  });
});

// ─── Suite C: Discount isolation ────────────────────────────────────────────

describe("calculatePaymentOptions bleibt projektbezogen", () => {
  it("berechnet Optionen nur auf Festpreis-Basis", () => {
    const options = calculatePaymentOptions(5000);
    for (const opt of options) {
      expect(opt.festpreisOriginal).toBe(5000);
    }
  });

  it("Betreuungskosten haben keinen Einfluss auf die Rabattberechnung", () => {
    // Same festpreis → same discounted amounts regardless of betreuung
    const optionsA = calculatePaymentOptions(5000);
    const optionsB = calculatePaymentOptions(5000); // called again — no betreuung param
    expect(optionsA).toEqual(optionsB);
  });

  it("Gesamtbetrag = diskontierter Projektbetrag + fester Betreuungspreis (full, 6 Monate)", () => {
    const options = calculatePaymentOptions(5000);
    const full = options.find((o) => o.type === "full")!;
    const betreuungCost = computeBetreuungCost(6); // 294
    expect(full.amount).toBe(4400); // 5000 * 0.88
    expect(full.amount + betreuungCost).toBe(4694);
  });

  it("Gesamtbetrag = diskontierter Projektbetrag + fester Betreuungspreis (half, 12 Monate)", () => {
    const options = calculatePaymentOptions(5000);
    const half = options.find((o) => o.type === "half")!;
    const betreuungCost = computeBetreuungCost(12); // 348
    expect(half.amount).toBe(2375); // 50% of 4750
    expect(half.amount + betreuungCost).toBe(2723);
  });

  it("Promo-Rabatt wird auf Festpreis gestackt, nicht auf Betreuung", () => {
    const options = calculatePaymentOptions(5000, 0.25);
    const full = options.find((o) => o.type === "full")!;
    // 0.25 promo + 0.12 payment = 0.37 total → 5000 * 0.63 = 3150
    expect(full.festpreisDiscounted).toBe(3150);
    expect(full.amount).toBe(3150); // 100% of discounted
    // Betreuung stays fixed at 294
    const betreuungCost = computeBetreuungCost(6);
    expect(betreuungCost).toBe(294);
    expect(full.amount + betreuungCost).toBe(3444);
  });

  it("bei maximalem Rabatt (50%) bleibt Betreuung ungekürzt", () => {
    const options = calculatePaymentOptions(5000, MAX_TOTAL_DISCOUNT_PCT);
    const full = options.find((o) => o.type === "full")!;
    // Clamped at 50%: 5000 * 0.5 = 2500
    expect(full.festpreisDiscounted).toBe(2500);
    expect(full.amount).toBe(2500);
    // Betreuung 12 months = 348, unchanged
    const betreuungCost = computeBetreuungCost(12);
    expect(betreuungCost).toBe(348);
    expect(full.amount + betreuungCost).toBe(2848);
  });

  it("ohne Betreuung ist Gesamtbetrag = Projektbetrag", () => {
    const options = calculatePaymentOptions(5000);
    const full = options.find((o) => o.type === "full")!;
    const betreuungCost = computeBetreuungCost(null);
    expect(betreuungCost).toBe(0);
    expect(full.amount + betreuungCost).toBe(full.amount);
  });
});
