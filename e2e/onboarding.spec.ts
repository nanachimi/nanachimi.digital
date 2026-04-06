import { test, expect } from "@playwright/test";
import { dismissBanners, fillOnboardingSteps } from "./helpers/onboarding";

test.describe("Onboarding — Full Angebot Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
    await dismissBanners(page);
  });

  test("shows 13 steps and progress bar", async ({ page }) => {
    await expect(page.locator("text=Frage 1 von 13")).toBeVisible();
    await expect(page.locator("text=Schritt 1 von 13")).toBeVisible();
  });

  test("Step 1: select Projekttyp enables Weiter", async ({ page }) => {
    const weiter = page.locator("button", { hasText: "Weiter" });
    await expect(weiter).toBeDisabled();

    await page
      .locator("button[type='button']", { hasText: "Etwas im Browser" })
      .click();
    await expect(weiter).toBeEnabled();
  });

  test("validation prevents proceeding without required fields", async ({
    page,
  }) => {
    const weiter = page.locator("button", { hasText: "Weiter" });

    // Step 1: no selection → Weiter disabled
    await expect(weiter).toBeDisabled();

    // Select and go to step 2
    await page
      .locator("button[type='button']", { hasText: "Etwas im Browser" })
      .click();
    await weiter.click();

    // Step 2: empty textarea → Weiter disabled
    await expect(weiter).toBeDisabled();

    // Type less than 10 chars
    await page.locator("textarea").fill("Kurz");
    await expect(weiter).toBeDisabled();

    // Type enough chars
    await page.locator("textarea").fill("Ein ausführliches Projekt");
    await expect(weiter).toBeEnabled();
    await weiter.click();

    // Step 3: Nutzerrollen — no selection → Weiter disabled
    await expect(weiter).toBeDisabled();

    // Select a role count → still disabled (Gruppenname required)
    await page
      .locator("button[type='button']", { hasText: "Nur ich" })
      .first()
      .click();
    await expect(weiter).toBeDisabled();

    // Fill mandatory Gruppenname → Weiter enabled
    await page.locator("input[placeholder*='Kunden']").first().fill("Kunden");
    await expect(weiter).toBeEnabled();
  });

  test("back button preserves data", async ({ page }) => {
    const weiter = page.locator("button", { hasText: "Weiter" });
    const zurueck = page.locator("button", { hasText: "Zurück" });

    // Step 1
    await page
      .locator("button[type='button']", { hasText: "Eine Handy-App" })
      .click();
    await weiter.click();

    // Step 2
    await page.locator("textarea").fill("Mein tolles Projekt");
    await weiter.click();

    // Step 3: select Nutzerrollen
    await page
      .locator("button[type='button']", { hasText: "Nur ich" })
      .first()
      .click();

    // Go back to step 2 — verify textarea preserved
    await zurueck.click();
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveValue("Mein tolles Projekt");

    // Go back to step 1 — verify selection persisted
    await zurueck.click();
    const mobileBtn = page.locator("button[type='button']", {
      hasText: "Eine Handy-App",
    });
    await expect(mobileBtn).toHaveCSS("border-color", /255/); // FFC62C border
  });

  test("Step 4: custom features — add and remove", async ({ page }) => {
    const weiter = page.locator("button", { hasText: "Weiter" });

    // Navigate to step 4: Step 1 (Projekttyp) → Step 2 (Beschreibung) → Step 3 (Nutzerrollen) → Step 4
    await page
      .locator("button[type='button']", { hasText: "Etwas im Browser" })
      .click();
    await weiter.click();
    await page.locator("textarea").fill("Projektbeschreibung ausführlich");
    await weiter.click();
    // Step 3: Nutzerrollen — select "Nur ich / eine Gruppe" + fill Gruppenname
    await page
      .locator("button[type='button']", { hasText: "Nur ich" })
      .first()
      .click();
    await page.locator("input[placeholder*='Kunden']").first().fill("Kunden");
    await weiter.click();

    // Now on step 4 — Funktionen
    await expect(page.locator("text=Was soll möglich sein?")).toBeVisible();

    // Select a predefined feature
    await page
      .locator("button[type='button']", {
        hasText: "Anmeldung & Benutzerkonten",
      })
      .click();

    // Add a custom feature
    const customInput = page.locator(
      "input[placeholder*='Kalender']"
    );
    await customInput.fill("Kalender-Export");
    await page.locator("button", { hasText: "Hinzufügen" }).click();

    // Verify custom chip appears
    await expect(page.locator("text=Kalender-Export").first()).toBeVisible();

    // Remove the custom feature
    const removeBtn = page.locator(
      "button[aria-label='Kalender-Export entfernen']"
    );
    await removeBtn.click();

    // Verify chip is removed
    await expect(
      page.locator("span", { hasText: "Kalender-Export" })
    ).not.toBeVisible();
  });

  test("complete full Angebot flow end-to-end", async ({ page }) => {
    test.setTimeout(60_000);
    await fillOnboardingSteps(page, {
      name: "Max Mustermann",
      email: "max@example.com",
    });

    // Step 13: Abschluss — verify estimate is shown
    await expect(
      page.locator("text=Wie möchten Sie weitermachen?")
    ).toBeVisible();

    // Select "Direkt loslegen"
    await page
      .locator("button[type='button']", { hasText: "Direkt loslegen" })
      .click();

    // Submit
    const submitBtn = page.locator("button", {
      hasText: "Angebot anfordern",
    });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify redirect to confirmation page
    await page.waitForURL(/\/onboarding\/bestaetigung\?typ=angebot&sid=/);
    await expect(page.locator("h1, h2").first()).toContainText(
      "Vielen Dank"
    );
  });

  test("progress bar updates with each step", async ({ page }) => {
    const weiter = page.locator("button", { hasText: "Weiter" });

    // Step 1
    await expect(page.locator("text=Schritt 1 von 13")).toBeVisible();

    await page
      .locator("button[type='button']", { hasText: "Etwas im Browser" })
      .click();
    await weiter.click();

    // Step 2
    await expect(page.locator("text=Schritt 2 von 13")).toBeVisible();

    await page.locator("textarea").fill("Ausführliche Beschreibung");
    await weiter.click();

    // Step 3
    await expect(page.locator("text=Schritt 3 von 13")).toBeVisible();
  });
});
