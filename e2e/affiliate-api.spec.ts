import { test, expect } from "@playwright/test";

// Cookies loaded from storageState — no login needed for authenticated tests
// Serial to avoid race conditions on mutable data (settings update)
test.describe.configure({ mode: "serial" });

test.describe("Affiliate Data API (authenticated)", () => {
  test("profile returns affiliate data", async ({ request }) => {
    const res = await request.get("/api/affiliates/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("email", "sysys@example.com");
    expect(body).toHaveProperty("handle", "sysys35");
    expect(body).toHaveProperty("commissionRate", 0.15);
    expect(body).toHaveProperty("status", "active");
  });

  test("campaigns returns list with joined campaign", async ({ request }) => {
    const res = await request.get("/api/affiliates/me/campaigns");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    const joined = body.find(
      (c: { name: string }) => c.name === "Test Startup Q2 2026",
    );
    expect(joined).toBeTruthy();
    expect(joined.joined).toBe(true);
    expect(joined.myCode).toBeTruthy();
    expect(joined.myCode.code).toBe("sysys3525");
  });

  test("referrals returns array", async ({ request }) => {
    const res = await request.get("/api/affiliates/me/referrals");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("commissions returns array", async ({ request }) => {
    const res = await request.get("/api/affiliates/me/commissions");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("payouts returns array", async ({ request }) => {
    const res = await request.get("/api/affiliates/me/payouts");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("settings update and restore name", async ({ request }) => {
    const update = await request.patch("/api/affiliates/me/settings", {
      data: { name: "Sysys API Test" },
    });
    expect(update.status()).toBe(200);
    expect((await update.json()).name).toBe("Sysys API Test");

    // Restore
    const restore = await request.patch("/api/affiliates/me/settings", {
      data: { name: "Sysys Test" },
    });
    expect(restore.status()).toBe(200);
  });
});

test.describe("Affiliate Data API (unauthenticated)", () => {
  // Override storageState to clear cookies for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test("all endpoints return 401 without session", async ({ request }) => {
    const endpoints = [
      "/api/affiliates/me",
      "/api/affiliates/me/referrals",
      "/api/affiliates/me/commissions",
      "/api/affiliates/me/payouts",
      "/api/affiliates/me/campaigns",
    ];

    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status()).toBe(401);
    }
  });
});
