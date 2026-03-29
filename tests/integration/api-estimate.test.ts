import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("POST /api/estimate (integration)", () => {
  it("returns estimate with valid input", async () => {
    const res = await fetch(`${BASE_URL}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projekttyp: "web",
        funktionen: ["Anmeldung & Benutzerkonten", "Suche & Filter"],
        rollenAnzahl: "1",
        designLevel: "standard",
        zeitrahmenMvp: "flexibel",
        zeitrahmenFinal: "2-3monate",
        budget: "1000-5000",
        betriebUndWartung: "nein",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("range");
    expect(body.range).toHaveProperty("untergrenze");
    expect(body.range).toHaveProperty("obergrenze");
    expect(body.range.untergrenze).toBeGreaterThan(0);
    expect(body.range.obergrenze).toBeGreaterThanOrEqual(body.range.untergrenze);
    expect(body).toHaveProperty("aufwand");
    expect(body.aufwand).toBeGreaterThanOrEqual(2);
    expect(body).toHaveProperty("riskLevel");
    expect(["low", "medium", "high"]).toContain(body.riskLevel);
    expect(body).toHaveProperty("slaMinutes");
    expect(body.slaMinutes).toBeGreaterThan(0);
  });

  it("returns estimate even with minimal input (defaults applied)", async () => {
    const res = await fetch(`${BASE_URL}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.range.untergrenze).toBeGreaterThan(0);
  });

  it("more features produce higher estimates", async () => {
    const small = await fetch(`${BASE_URL}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projekttyp: "web",
        funktionen: ["Suche & Filter"],
        rollenAnzahl: "1",
        designLevel: "standard",
      }),
    }).then((r) => r.json());

    const big = await fetch(`${BASE_URL}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    }).then((r) => r.json());

    expect(big.range.obergrenze).toBeGreaterThan(small.range.obergrenze);
    expect(big.aufwand).toBeGreaterThan(small.aufwand);
  });
});
