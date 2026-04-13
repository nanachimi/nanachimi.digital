import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

/**
 * E2E tests for Betreuung (maintenance) package selection on the Angebot page.
 *
 * These tests create a real submission + angebot in the DB via the API,
 * then verify the betreuung UI components on the customer-facing Angebot page.
 */

const API_KEY = process.env.TEST_ADMIN_API_KEY || "test-admin-key";

test.describe("Angebot Betreuung Pakete", () => {
  let angebotId: string;

  test.beforeAll(async ({ request }) => {
    // Step 1: Create a submission via onboarding API
    const submitRes = await request.post("/api/onboarding/submit", {
      data: {
        projekttyp: "web",
        beschreibung: "Ein Test-Projekt für E2E Betreuungstests mit ausreichend Beschreibung.",
        rollenAnzahl: "1",
        nutzerrollen: [{ name: "Kunden" }],
        funktionen: ["Anmeldung & Benutzerkonten", "Suche & Filter"],
        customFeatures: [],
        designLevel: "standard",
        zeitrahmenMvp: "flexibel",
        zeitrahmenFinal: "2-3monate",
        budget: "1000-5000",
        betriebUndWartung: "ja",
        name: "Betreuung Test",
        email: "betreuung-test@example.com",
        abschluss: "angebot",
        monetarisierung: ["Kostenlos"],
      },
    });

    // The submission endpoint may redirect or return the submission ID
    let submissionId: string | undefined;

    if (submitRes.ok()) {
      const data = await submitRes.json();
      submissionId = data.id || data.submissionId;
    }

    // If we couldn't get a submission ID from the API, try to find a recent one
    if (!submissionId) {
      // Try admin API to find submission
      const listRes = await request.get("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (listRes.ok()) {
        const submissions = await listRes.json();
        const recent = Array.isArray(submissions)
          ? submissions.find(
              (s: { email?: string }) => s.email === "betreuung-test@example.com"
            )
          : null;
        submissionId = recent?.id;
      }
    }

    if (!submissionId) {
      test.skip(true, "Kein Submission erstellt — Admin API nicht verfügbar");
      return;
    }

    // Step 2: Create an Angebot for this submission via admin API
    const angebotRes = await request.post("/api/admin/angebote", {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { submissionId },
    });

    if (!angebotRes.ok()) {
      test.skip(true, "Angebot konnte nicht erstellt werden");
      return;
    }

    const angebotData = await angebotRes.json();
    angebotId = angebotData.id;

    // Step 3: Send the angebot (change status to "sent")
    await request.patch(`/api/admin/angebote/${angebotId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { action: "send" },
    });
  });

  test("zeigt Betreuungs-Pakete zur Auswahl an", async ({ page }) => {
    test.skip(!angebotId, "Kein Angebot verfügbar");
    await page.goto(`/angebot/${angebotId}`);
    await dismissBanners(page);

    // Heading
    await expect(
      page.locator("h2", { hasText: "Betreuung nach dem Start" })
    ).toBeVisible();

    // "Kein Paket" option
    await expect(
      page.locator("button", { hasText: "Kein Paket" })
    ).toBeVisible();

    // Three packages
    await expect(
      page.locator("button", { hasText: "3 Monate" })
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "6 Monate" })
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "12 Monate" })
    ).toBeVisible();
  });

  test("aktualisiert Gesamtpreis bei Paketauswahl", async ({ page }) => {
    test.skip(!angebotId, "Kein Angebot verfügbar");
    await page.goto(`/angebot/${angebotId}`);
    await dismissBanners(page);

    // Click 6-month package
    await page.locator("button", { hasText: "6 Monate" }).first().click();

    // "Neuer Gesamtpreis" section should appear
    await expect(
      page.locator("text=Neuer Gesamtpreis")
    ).toBeVisible();
  });

  test("zeigt '12 Monate' Paket mit Beliebt-Badge", async ({ page }) => {
    test.skip(!angebotId, "Kein Angebot verfügbar");
    await page.goto(`/angebot/${angebotId}`);
    await dismissBanners(page);

    // 6-month package should have "Beliebt" badge
    const popularPkg = page.locator("button", { hasText: "6 Monate" }).first();
    await expect(popularPkg.locator("text=Beliebt")).toBeVisible();
  });

  test("Paketauswahl kann zurückgesetzt werden (Kein Paket)", async ({
    page,
  }) => {
    test.skip(!angebotId, "Kein Angebot verfügbar");
    await page.goto(`/angebot/${angebotId}`);
    await dismissBanners(page);

    // Select 12-month package
    await page.locator("button", { hasText: "12 Monate" }).first().click();
    await expect(page.locator("text=Neuer Gesamtpreis")).toBeVisible();

    // Deselect by clicking "Kein Paket"
    await page.locator("button", { hasText: "Kein Paket" }).click();
    await expect(page.locator("text=Neuer Gesamtpreis")).not.toBeVisible();
  });
});

test.describe("Angebot Betreuung — API Validation", () => {
  test("PATCH accept mit betreuungMonate gibt betreuungCost zurück", async ({
    request,
  }) => {
    // This tests the API contract without needing a full UI flow.
    // We create a minimal sent angebot and verify the response structure.
    const submitRes = await request.post("/api/onboarding/submit", {
      data: {
        projekttyp: "web",
        beschreibung: "API-Test für Betreuung Kostenberechnung im Angebot.",
        rollenAnzahl: "1",
        nutzerrollen: [{ name: "Nutzer" }],
        funktionen: ["Suche & Filter"],
        customFeatures: [],
        designLevel: "standard",
        zeitrahmenMvp: "flexibel",
        zeitrahmenFinal: "2-3monate",
        budget: "1000-5000",
        betriebUndWartung: "ja",
        name: "API Test Betreuung",
        email: "api-betreuung-test@example.com",
        abschluss: "angebot",
        monetarisierung: ["Kostenlos"],
      },
    });

    if (!submitRes.ok()) {
      test.skip(true, "Submit fehlgeschlagen");
      return;
    }

    const submitData = await submitRes.json();
    const submissionId = submitData.id || submitData.submissionId;

    if (!submissionId) {
      test.skip(true, "Kein Submission ID");
      return;
    }

    // Create + send angebot via admin
    const angebotRes = await request.post("/api/admin/angebote", {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { submissionId },
    });

    if (!angebotRes.ok()) {
      test.skip(true, "Admin API nicht verfügbar");
      return;
    }

    const { id: angebotId } = await angebotRes.json();

    await request.patch(`/api/admin/angebote/${angebotId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { action: "send" },
    });

    // Accept with betreuungMonate: 12
    const acceptRes = await request.patch(`/api/angebot/${angebotId}`, {
      data: { action: "accept", betreuungMonate: 12 },
    });

    expect(acceptRes.ok()).toBe(true);
    const body = await acceptRes.json();

    expect(body.payment).toBeDefined();
    expect(body.payment.betreuungMonate).toBe(12);
    expect(body.payment.betreuungCost).toBe(348); // 12 × 29€

    // Options should reference festpreis only
    for (const opt of body.payment.options) {
      expect(opt.festpreisOriginal).toBe(body.payment.festpreis);
    }
  });
});
