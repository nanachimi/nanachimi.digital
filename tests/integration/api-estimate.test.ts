import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database — getPricingConfig falls back to DEFAULT_PRICING_CONFIG when DB is unavailable
vi.mock("@/lib/db", () => ({
  prisma: {
    pricingConfig: { findUnique: vi.fn().mockResolvedValue(null) },
    submission: { count: vi.fn().mockResolvedValue(0) },
  },
}));

import { calculateEstimate } from "@/lib/estimation";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("calculateEstimate (integration)", () => {
  it("returns estimate with valid input", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Anmeldung & Benutzerkonten", "Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
      budget: "1000-5000",
      betriebUndWartung: "nein",
    });

    expect(result).toHaveProperty("range");
    expect(result.range).toHaveProperty("untergrenze");
    expect(result.range).toHaveProperty("obergrenze");
    expect(result.range.untergrenze).toBeGreaterThan(0);
    expect(result.range.obergrenze).toBeGreaterThanOrEqual(result.range.untergrenze);
    expect(result).toHaveProperty("aufwand");
    expect(result.aufwand).toBeGreaterThanOrEqual(2);
    expect(result).toHaveProperty("riskLevel");
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
    expect(result).toHaveProperty("slaMinutes");
    expect(result.slaMinutes).toBeGreaterThan(0);
  });

  it("returns estimate even with minimal input (defaults applied)", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: [],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(result.range.untergrenze).toBeGreaterThan(0);
  });

  it("more features produce higher estimates", async () => {
    const small = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    const big = await calculateEstimate({
      projekttyp: "beides",
      funktionen: [
        "Anmeldung & Benutzerkonten",
        "Verwaltungsbereich",
        "Online bezahlen",
        "E-Mail-Benachrichtigungen",
        "Chat-Funktion",
        "Suche & Filter",
        "Auswertungen & Statistiken",
      ],
      rollenAnzahl: "3+",
      designLevel: "premium",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(big.range.obergrenze).toBeGreaterThan(small.range.obergrenze);
    expect(big.aufwand).toBeGreaterThan(small.aufwand);
  });
});
