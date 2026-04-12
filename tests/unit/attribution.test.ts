import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    affiliate: { findUnique: (...args: unknown[]) => findUnique(...args) },
    referral: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import {
  isValidHandle,
  resolveAttribution,
  HANDLE_PATTERN,
  REF_COOKIE_MAX_AGE_SECONDS,
  RESERVED_HANDLES,
} from "@/lib/affiliate/attribution";

describe("isValidHandle", () => {
  it("accepts alphanumerics, underscores, and dashes within 3-32 chars", () => {
    expect(isValidHandle("syssys35")).toBe(true);
    expect(isValidHandle("jane_doe")).toBe(true);
    expect(isValidHandle("nana-chimi")).toBe(true);
    expect(isValidHandle("abc")).toBe(true);
    expect(isValidHandle("a".repeat(32))).toBe(true);
  });

  it("rejects too-short, too-long, and special-char handles", () => {
    expect(isValidHandle("ab")).toBe(false);
    expect(isValidHandle("a".repeat(33))).toBe(false);
    expect(isValidHandle("jane.doe")).toBe(false);
    expect(isValidHandle("jane doe")).toBe(false);
    expect(isValidHandle("jané")).toBe(false);
  });

  it("rejects reserved handles that would collide with routes", () => {
    for (const reserved of ["admin", "api", "backoffice", "affiliates", "angebot"]) {
      expect(RESERVED_HANDLES.has(reserved)).toBe(true);
      expect(isValidHandle(reserved)).toBe(false);
    }
  });
});

describe("HANDLE_PATTERN", () => {
  it("matches the documented 3-32 char range", () => {
    expect(HANDLE_PATTERN.test("abc")).toBe(true);
    expect(HANDLE_PATTERN.test("ab")).toBe(false);
  });
});

describe("REF_COOKIE_MAX_AGE_SECONDS", () => {
  it("is exactly 2 years in seconds", () => {
    expect(REF_COOKIE_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 365 * 2);
  });
});

describe("resolveAttribution", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  const activeAff = (id: string, handle: string) => ({
    id,
    handle,
    status: "active",
    commissionRate: "0.10",
  });

  it("falls back to 'none' when neither cookie nor promo is present", async () => {
    const result = await resolveAttribution({
      cookieHandle: null,
      promoCode: null,
    });
    expect(result).toEqual({
      winnerAffiliateId: null,
      firstTouchAffiliateId: null,
      source: "none",
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("credits the cookie affiliate when no promo is used", async () => {
    findUnique.mockResolvedValueOnce(activeAff("aff_cookie", "syssys35"));
    const result = await resolveAttribution({
      cookieHandle: "syssys35",
      promoCode: null,
    });
    expect(result.source).toBe("cookie");
    expect(result.winnerAffiliateId).toBe("aff_cookie");
    expect(result.firstTouchAffiliateId).toBe("aff_cookie");
  });

  it("credits the promo affiliate even when a different cookie is present", async () => {
    // 1st lookup → cookie affiliate (firstTouch)
    // 2nd lookup → promo affiliate (winner)
    findUnique.mockResolvedValueOnce(activeAff("aff_cookie", "syssys35"));
    findUnique.mockResolvedValueOnce(activeAff("aff_promo", "janedoe"));

    const result = await resolveAttribution({
      cookieHandle: "syssys35",
      promoCode: { id: "promo_1", affiliateId: "aff_promo" },
    });

    expect(result.source).toBe("promo_code");
    expect(result.winnerAffiliateId).toBe("aff_promo");
    // first-touch is still logged for analytics
    expect(result.firstTouchAffiliateId).toBe("aff_cookie");
  });

  it("falls back to cookie when the promo code is an admin (unattached) code", async () => {
    findUnique.mockResolvedValueOnce(activeAff("aff_cookie", "syssys35"));
    const result = await resolveAttribution({
      cookieHandle: "syssys35",
      promoCode: { id: "promo_admin", affiliateId: null },
    });
    expect(result.source).toBe("cookie");
    expect(result.winnerAffiliateId).toBe("aff_cookie");
  });

  it("falls back to cookie when the promo affiliate is suspended", async () => {
    findUnique.mockResolvedValueOnce(activeAff("aff_cookie", "syssys35"));
    findUnique.mockResolvedValueOnce({
      id: "aff_promo",
      handle: "janedoe",
      status: "suspended",
      commissionRate: "0.10",
    });

    const result = await resolveAttribution({
      cookieHandle: "syssys35",
      promoCode: { id: "promo_1", affiliateId: "aff_promo" },
    });

    expect(result.source).toBe("cookie");
    expect(result.winnerAffiliateId).toBe("aff_cookie");
  });

  it("returns 'none' when the cookie handle points to a suspended affiliate and no promo is used", async () => {
    findUnique.mockResolvedValueOnce({
      id: "aff_susp",
      handle: "syssys35",
      status: "suspended",
      commissionRate: "0.10",
    });
    const result = await resolveAttribution({
      cookieHandle: "syssys35",
      promoCode: null,
    });
    expect(result.source).toBe("none");
    expect(result.winnerAffiliateId).toBeNull();
  });

  it("ignores invalid handle patterns without a DB call", async () => {
    const result = await resolveAttribution({
      cookieHandle: "has space",
      promoCode: null,
    });
    expect(result.source).toBe("none");
    expect(findUnique).not.toHaveBeenCalled();
  });
});
