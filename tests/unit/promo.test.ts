import { describe, it, expect, vi } from "vitest";

// Prisma is only touched by validatePromoCode / getPromoDiscountForSubmission /
// isCodeAvailable, which we don't exercise here. Mocked defensively so the module loads.
vi.mock("@/lib/db", () => ({
  prisma: {
    promoCode: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    submission: { findUnique: vi.fn() },
  },
}));

import {
  composeAdminCode,
  composeAffiliateCode,
  stackDiscounts,
  applyDiscounts,
  MAX_TOTAL_DISCOUNT,
} from "@/lib/promo";

describe("composeAdminCode", () => {
  it("lowercases the campaign code", () => {
    expect(composeAdminCode("Startup2026")).toBe("startup2026");
    expect(composeAdminCode("BlackFriday")).toBe("blackfriday");
    expect(composeAdminCode("SUMMER")).toBe("summer");
  });

  it("is idempotent on already-lowercase input", () => {
    expect(composeAdminCode("winter")).toBe("winter");
  });
});

describe("composeAffiliateCode", () => {
  it("concatenates handle + integer percent, lowercased", () => {
    expect(composeAffiliateCode("sysys35", 0.25)).toBe("sysys3525");
    expect(composeAffiliateCode("JaneDoe", 0.5)).toBe("janedoe50");
    expect(composeAffiliateCode("abc", 0.1)).toBe("abc10");
  });

  it("rounds percentages to integers", () => {
    expect(composeAffiliateCode("x", 0.333)).toBe("x33");
    expect(composeAffiliateCode("x", 0.999)).toBe("x100");
  });
});

describe("stackDiscounts", () => {
  it("sums additive discounts below the cap", () => {
    expect(stackDiscounts(0.25, 0.12)).toEqual({
      total: 0.37,
      promo: 0.25,
      payment: 0.12,
      clamped: false,
    });
  });

  it("clamps the total at MAX_TOTAL_DISCOUNT", () => {
    const stack = stackDiscounts(0.5, 0.12);
    expect(stack.total).toBe(MAX_TOTAL_DISCOUNT);
    expect(stack.clamped).toBe(true);
  });

  it("lets a lone promo use the full cap", () => {
    expect(stackDiscounts(0.5, 0).total).toBe(0.5);
    expect(stackDiscounts(0.5, 0).clamped).toBe(false);
  });
});

describe("applyDiscounts", () => {
  it("applies additive stacking to the festpreis", () => {
    // 1000 € × (1 - 0.25 - 0.12) = 630 €
    const result = applyDiscounts(1000, 0.25, 0.12);
    expect(result.finalPriceEur).toBe(630);
    expect(result.totalDiscountPct).toBeCloseTo(0.37, 5);
    expect(result.savingsEur).toBe(370);
  });

  it("clamps excessive stacking at 50%", () => {
    // 1000 € × (1 - 0.5) = 500 € — never goes below despite 0.60 + 0.12
    const result = applyDiscounts(1000, 0.6, 0.12);
    expect(result.finalPriceEur).toBe(500);
    expect(result.totalDiscountPct).toBe(0.5);
  });

  it("applies full discount even on small prices", () => {
    // 50% discount on 400€ → 200€ (no floor clamp)
    const result = applyDiscounts(400, 0.5, 0);
    expect(result.finalPriceEur).toBe(200);
    expect(result.savingsEur).toBe(200);
  });

  it("returns festpreis unchanged when no discounts apply", () => {
    const result = applyDiscounts(1500, 0, 0);
    expect(result.finalPriceEur).toBe(1500);
    expect(result.totalDiscountPct).toBe(0);
    expect(result.savingsEur).toBe(0);
  });
});
