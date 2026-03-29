import { test, expect } from "@playwright/test";

test.describe("Estimate API", () => {
  test("POST with valid data returns estimate", async ({ request }) => {
    const res = await request.post("/api/estimate", {
      data: {
        projekttyp: "web",
        funktionen: ["Anmeldung & Benutzerkonten", "Suche & Filter"],
        rollenAnzahl: "1",
        designLevel: "standard",
        zeitrahmenMvp: "flexibel",
        zeitrahmenFinal: "2-3monate",
        budget: "1000-5000",
        betriebUndWartung: "nein",
      },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("range");
    expect(body.range).toHaveProperty("untergrenze");
    expect(body.range).toHaveProperty("obergrenze");
    expect(body.range.untergrenze).toBeGreaterThan(0);
    expect(body.range.obergrenze).toBeGreaterThanOrEqual(
      body.range.untergrenze
    );
    expect(body).toHaveProperty("aufwand");
    expect(body.aufwand).toBeGreaterThan(0);
    expect(body).toHaveProperty("riskLevel");
    expect(["low", "medium", "high"]).toContain(body.riskLevel);
    expect(body).toHaveProperty("slaMinutes");
    expect(body.slaMinutes).toBeGreaterThan(0);
  });

  test("POST with many features returns higher estimate", async ({
    request,
  }) => {
    const smallRes = await request.post("/api/estimate", {
      data: {
        projekttyp: "web",
        funktionen: ["Suche & Filter"],
        rollenAnzahl: "1",
        designLevel: "standard",
        zeitrahmenMvp: "flexibel",
        zeitrahmenFinal: "2-3monate",
      },
    });

    const bigRes = await request.post("/api/estimate", {
      data: {
        projekttyp: "beides",
        funktionen: [
          "Anmeldung & Benutzerkonten",
          "Verwaltungsbereich",
          "Online bezahlen",
          "E-Mail-Benachrichtigungen",
          "Chat-Funktion",
          "Suche & Filter",
          "Dateien hochladen",
          "Anbindung an andere Systeme",
          "Auswertungen & Statistiken",
        ],
        rollenAnzahl: "3+",
        designLevel: "premium",
        zeitrahmenMvp: "48h",
        zeitrahmenFinal: "6monate",
      },
    });

    expect(smallRes.status()).toBe(200);
    expect(bigRes.status()).toBe(200);

    const small = await smallRes.json();
    const big = await bigRes.json();

    expect(big.range.obergrenze).toBeGreaterThan(small.range.obergrenze);
    expect(big.aufwand).toBeGreaterThan(small.aufwand);
  });

  test("POST with empty body still returns estimate (defaults applied)", async ({
    request,
  }) => {
    // The estimate API applies defaults for all fields, so empty body is valid
    const res = await request.post("/api/estimate", {
      data: {},
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("range");
    expect(body.range.untergrenze).toBeGreaterThan(0);
  });
});
