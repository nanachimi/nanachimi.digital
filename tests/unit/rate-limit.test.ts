import { describe, it, expect, beforeEach } from "vitest";

// We test the RateLimiter via the exported instances
// Re-import fresh module for each test to avoid shared state issues
describe("rate-limit", () => {
  // We'll test the logic directly since the exported instances share state across tests
  it("publicApiLimiter allows 20 requests per minute", async () => {
    const { publicApiLimiter } = await import("@/lib/auth/rate-limit");
    const testIp = `rate-test-public-${Date.now()}`;

    for (let i = 0; i < 20; i++) {
      expect(publicApiLimiter.check(testIp)).toBe(true);
    }
    // 21st should be blocked
    expect(publicApiLimiter.check(testIp)).toBe(false);
  });

  it("formLimiter allows 5 requests per 10 minutes", async () => {
    const { formLimiter } = await import("@/lib/auth/rate-limit");
    const testIp = `rate-test-form-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      expect(formLimiter.check(testIp)).toBe(true);
    }
    expect(formLimiter.check(testIp)).toBe(false);
  });

  it("different IPs are independent", async () => {
    const { formLimiter } = await import("@/lib/auth/rate-limit");
    const ip1 = `rate-test-a-${Date.now()}`;
    const ip2 = `rate-test-b-${Date.now()}`;

    // Exhaust ip1
    for (let i = 0; i < 5; i++) formLimiter.check(ip1);
    expect(formLimiter.check(ip1)).toBe(false);

    // ip2 should still be allowed
    expect(formLimiter.check(ip2)).toBe(true);
  });

  it("checkRateLimit legacy API works", async () => {
    const { checkRateLimit } = await import("@/lib/auth/rate-limit");
    const testIp = `rate-test-legacy-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(testIp)).toBe(true);
    }
    expect(checkRateLimit(testIp)).toBe(false);
  });

  it("getRateLimitResetSeconds returns positive value when limited", async () => {
    const { checkRateLimit, getRateLimitResetSeconds } = await import("@/lib/auth/rate-limit");
    const testIp = `rate-test-reset-${Date.now()}`;

    for (let i = 0; i < 5; i++) checkRateLimit(testIp);
    const seconds = getRateLimitResetSeconds(testIp);
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(900); // 15 minutes max
  });
});
