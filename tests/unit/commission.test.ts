import { describe, it, expect, vi } from "vitest";

// Mock Prisma — we only exercise the pure helpers here.
vi.mock("@/lib/db", () => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    affiliate: { findUnique: vi.fn() },
    referral: { findFirst: vi.fn() },
    commission: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    incident: { create: vi.fn() },
  },
}));

import {
  calculateCommissionAmount,
  isWithinReferralWindow,
  computeCommissionExpiresAt,
  computeApprovalEligibleAt,
  REFERRAL_WINDOW_YEARS,
  COMMISSION_HOLD_DAYS,
} from "@/lib/affiliate/commission";

describe("calculateCommissionAmount", () => {
  it("multiplies payment amount by rate and floors to cents", () => {
    // 38000 cents × 0.10 = 3800 cents
    expect(calculateCommissionAmount(38000, 0.1)).toBe(3800);
  });

  it("floors instead of rounding — never over-pays", () => {
    // 11250 × 0.15 = 1687.5 → floor → 1687
    expect(calculateCommissionAmount(11250, 0.15)).toBe(1687);
    // 1001 × 0.10 = 100.1 → floor → 100
    expect(calculateCommissionAmount(1001, 0.1)).toBe(100);
  });

  it("returns 0 when either input is non-positive", () => {
    expect(calculateCommissionAmount(0, 0.1)).toBe(0);
    expect(calculateCommissionAmount(-500, 0.1)).toBe(0);
    expect(calculateCommissionAmount(1000, 0)).toBe(0);
    expect(calculateCommissionAmount(1000, -0.1)).toBe(0);
  });

  it("computes plan case A — 38 € commission on 380 € payment at 10%", () => {
    // festpreis 1000 €, promo 50 % + Vollzahlung 12 % = 62 % (clamped in applyDiscounts)
    // clamped at 50 % → final 500 € — tested in promo.test.ts
    // Here we test the commission layer directly with the post-discount amount.
    // A different path: 1000 × (1 - 0.50 - 0.12) = 380 € (unclamped if MAX were higher)
    expect(calculateCommissionAmount(38000, 0.1)).toBe(3800); // 38.00 €
  });

  it("computes plan case B — 16.87 € commission on 112.50 € tranche_1 at 15%", () => {
    // festpreis 1000 €, promo 25 %, tranche_1 = 15 % of 750 € = 112.50 €
    // commission = 112.50 × 0.15 = 16.875 → floored to 16.87 €
    expect(calculateCommissionAmount(11250, 0.15)).toBe(1687);
  });
});

describe("isWithinReferralWindow", () => {
  it("accepts payments before the 2-year limit", () => {
    const touch = new Date("2026-01-01T00:00:00Z");
    const payment = new Date("2027-12-31T23:59:59Z");
    expect(isWithinReferralWindow(touch, payment)).toBe(true);
  });

  it("accepts payments exactly on the 2-year boundary", () => {
    const touch = new Date("2026-01-01T00:00:00Z");
    const payment = new Date("2028-01-01T00:00:00Z");
    expect(isWithinReferralWindow(touch, payment)).toBe(true);
  });

  it("rejects payments past the 2-year limit", () => {
    const touch = new Date("2026-01-01T00:00:00Z");
    const payment = new Date("2028-01-02T00:00:00Z");
    expect(isWithinReferralWindow(touch, payment)).toBe(false);
  });

  it("handles 25-months-later edge case from plan", () => {
    // Plan: "un Payment encaissé 23 mois après le premier touch est éligible;
    // 25 mois après ne l'est plus."
    const touch = new Date("2026-01-15T00:00:00Z");
    const at23Months = new Date("2027-12-15T00:00:00Z");
    const at25Months = new Date("2028-02-15T00:00:00Z");
    expect(isWithinReferralWindow(touch, at23Months)).toBe(true);
    expect(isWithinReferralWindow(touch, at25Months)).toBe(false);
  });
});

describe("computeCommissionExpiresAt", () => {
  it("adds REFERRAL_WINDOW_YEARS to the first touch date", () => {
    expect(REFERRAL_WINDOW_YEARS).toBe(2);
    const touch = new Date("2026-04-11T10:00:00Z");
    const expected = new Date("2028-04-11T10:00:00Z");
    expect(computeCommissionExpiresAt(touch).getTime()).toBe(expected.getTime());
  });

  it("does not mutate the input date", () => {
    const touch = new Date("2026-04-11T10:00:00Z");
    const before = touch.getTime();
    computeCommissionExpiresAt(touch);
    expect(touch.getTime()).toBe(before);
  });
});

describe("computeApprovalEligibleAt", () => {
  it("adds the 14-day hold to earnedAt", () => {
    expect(COMMISSION_HOLD_DAYS).toBe(14);
    const earned = new Date("2026-04-11T00:00:00Z");
    const eligible = computeApprovalEligibleAt(earned);
    expect(eligible.toISOString()).toBe("2026-04-25T00:00:00.000Z");
  });
});
