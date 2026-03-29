import { describe, it, expect, vi } from "vitest";

// Mock Prisma before importing estimation module
vi.mock("@/lib/db", () => ({
  prisma: {
    pricingConfig: { findUnique: vi.fn() },
    submission: { count: vi.fn().mockResolvedValue(0) },
  },
}));

const MOCK_CONFIG = {
  weeklyRates: { "48h": 1000, "1-2wochen": 700, "1monat": 600, flexibel: 495 },
  featureDays: {
    "Anmeldung & Benutzerkonten": 1,
    "Suche & Filter": 1,
    "Online bezahlen": 2.5,
    "Chat-Funktion": 2.5,
    "Anbindung an andere Systeme": 1.5,
    "Auswertungen & Statistiken": 2,
    Verwaltungsbereich: 2,
    "E-Mail-Benachrichtigungen": 0.5,
  },
  bwPackages: [
    { months: 3, pricePerMonth: 69 },
    { months: 6, pricePerMonth: 49 },
    { months: 12, pricePerMonth: 29 },
  ],
  bwIncludedMonths: 1,
  riskThresholds: { lowMaxFeatures: 5, mediumMaxFeatures: 8 },
  demand: { maxCapacity: 3, maxSurcharge: 0.2, adminOverride: 0 },
  autoAngebotLimits: { minPrice: 299, maxPrice: 4999 },
  baseSetupDays: 2,
};

// Mock pricing-config to return our test config
vi.mock("@/lib/pricing-config", () => ({
  getPricingConfig: vi.fn().mockResolvedValue(MOCK_CONFIG),
  calculateDemandFactor: vi.fn().mockResolvedValue({
    effectiveFactor: 1.0,
    currentLoad: 0,
    maxCapacity: 3,
  }),
}));

// Now import after mocks are set up
const { calculateEstimate } = await import("@/lib/estimation");

describe("estimation engine", () => {
  it("calculates a basic web project estimate", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Anmeldung & Benutzerkonten", "Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(result.festpreis).toBeGreaterThan(0);
    expect(result.aufwand).toBeGreaterThanOrEqual(2); // minimum 2 PT
    expect(result.riskLevel).toBe("low");
    expect(result.slaMinutes).toBe(30);
    expect(result.range.untergrenze).toBeGreaterThan(0);
    expect(result.range.obergrenze).toBeGreaterThanOrEqual(result.range.untergrenze);
  });

  it("mobile project has higher price than web", async () => {
    const web = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    const mobile = await calculateEstimate({
      projekttyp: "mobile",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(mobile.festpreis).toBeGreaterThan(web.festpreis);
  });

  it("premium design costs more than standard", async () => {
    const standard = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    const premium = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "premium",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(premium.festpreis).toBeGreaterThan(standard.festpreis);
  });

  it("48h timeline triggers high risk", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "48h",
      zeitrahmenFinal: "1monat",
    });

    expect(result.riskLevel).toBe("high");
    expect(result.slaMinutes).toBe(120);
  });

  it("many features trigger medium/high risk", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: [
        "Anmeldung & Benutzerkonten",
        "Verwaltungsbereich",
        "Online bezahlen",
        "E-Mail-Benachrichtigungen",
        "Chat-Funktion",
        "Suche & Filter",
      ],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(["medium", "high"]).toContain(result.riskLevel);
  });

  it("custom features add 1 day each", async () => {
    const without = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    const withCustom = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter", "custom:Kalender", "custom:Export"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(withCustom.aufwand).toBeGreaterThan(without.aufwand);
  });

  it("includes B&W info in output", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
      betriebUndWartung: "ja",
    });

    expect(result.bwInfo.includedMonths).toBe(1);
    expect(result.bwInfo.customerWants).toBe(true);
    expect(result.bwInfo.packages).toHaveLength(3);
  });

  it("festpreis is rounded to nearest 10", async () => {
    const result = await calculateEstimate({
      projekttyp: "web",
      funktionen: ["Suche & Filter"],
      rollenAnzahl: "1",
      designLevel: "standard",
      zeitrahmenMvp: "flexibel",
      zeitrahmenFinal: "2-3monate",
    });

    expect(result.festpreis % 10).toBe(0);
    expect(result.range.untergrenze % 10).toBe(0);
    expect(result.range.obergrenze % 10).toBe(0);
  });
});
