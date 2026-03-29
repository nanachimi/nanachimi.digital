import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("GET /api/health (integration)", () => {
  it("returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(401);
  });

  it("returns health status with valid bearer token", async () => {
    const secret = process.env.HEALTH_CHECK_SECRET;
    if (!secret) {
      console.log("HEALTH_CHECK_SECRET not set — skipping auth health test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { Authorization: `Bearer ${secret}` },
    });

    expect([200, 503]).toContain(res.status);
    const body = await res.json();

    expect(body).toHaveProperty("status");
    expect(["healthy", "degraded", "unhealthy"]).toContain(body.status);
    expect(body).toHaveProperty("checks");
    expect(Array.isArray(body.checks)).toBe(true);
    expect(body).toHaveProperty("timestamp");

    // Verify expected services are checked
    const serviceNames = body.checks.map((c: { service: string }) => c.service);
    expect(serviceNames).toContain("database");
    expect(serviceNames).toContain("environment");
  });
});
