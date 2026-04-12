import { test, expect } from "@playwright/test";

// Cookies loaded from storageState — no login needed

test.describe("Affiliate Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal");
    await page.waitForLoadState("load");
  });

  test("dashboard renders KPIs and referral link", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Willkommen, Sysys");
    await expect(page.locator("text=Ihr Partner-Dashboard")).toBeVisible();

    // Referral link
    await expect(
      page.locator("text=nanachimi.digital/@sysys35"),
    ).toBeVisible();

    // KPI labels (CSS text-transform: uppercase in DOM)
    await expect(page.locator("text=Referrals").first()).toBeVisible();
    await expect(page.locator("text=Ausstehend")).toBeVisible();
    await expect(page.locator("text=Freigegeben")).toBeVisible();
    await expect(page.locator("text=Gesamt verdient")).toBeVisible();

    // Commission rate
    await expect(page.locator("text=15%")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    const nav = page.locator("aside nav");

    // Wait for hydration — sidebar links need React event handlers
    await expect(nav.locator("a", { hasText: "Referrals" })).toBeVisible();

    // Referrals
    await nav.locator("a", { hasText: "Referrals" }).click();
    await expect(page).toHaveURL(/\/portal\/referrals/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Referrals");
    await page.waitForLoadState("load");

    // Kommissionen
    await nav.locator("a", { hasText: "Kommissionen" }).click();
    await expect(page).toHaveURL(/\/portal\/commissions/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Kommissionen");
    await page.waitForLoadState("load");

    // Kampagnen
    await nav.locator("a", { hasText: "Kampagnen" }).click();
    await expect(page).toHaveURL(/\/portal\/kampagnen/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Kampagnen");
    await page.waitForLoadState("load");

    // Einstellungen
    await nav.locator("a", { hasText: "Einstellungen" }).click();
    await expect(page).toHaveURL(/\/portal\/einstellungen/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Einstellungen");
    await page.waitForLoadState("load");

    // Back to Dashboard
    await nav.locator("a", { hasText: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Willkommen");
  });

  test("referrals page renders table", async ({ page }) => {
    await page.goto("/portal/referrals");

    await expect(page.locator("h1")).toContainText("Referrals");
    await expect(page.locator("th", { hasText: "Datum" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Quelle" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Conversion" })).toBeVisible();
  });

  test("kommissionen page renders summary tiles", async ({ page }) => {
    await page.goto("/portal/commissions");

    await expect(page.locator("h1")).toContainText("Kommissionen");
    await expect(page.locator("text=Ausstehend").first()).toBeVisible();
    await expect(page.locator("text=Freigegeben").first()).toBeVisible();
    await expect(page.locator("text=Ausgezahlt")).toBeVisible();
    await expect(page.locator("text=Storniert")).toBeVisible();
    await expect(page.locator("th", { hasText: "Betrag" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
  });

  test("kampagnen page shows joined campaign with promo code", async ({
    page,
  }) => {
    await page.goto("/portal/kampagnen");

    await expect(page.locator("h1")).toContainText("Kampagnen");
    await expect(
      page.locator("h2", { hasText: "Meine Kampagnen" }),
    ).toBeVisible();
    await expect(page.locator("text=Test Startup Q2 2026")).toBeVisible();
    await expect(page.locator("code", { hasText: "sysys3525" })).toBeVisible();
    await expect(page.locator("text=25% Rabatt")).toBeVisible();
  });

  test("einstellungen page renders account info and forms", async ({
    page,
  }) => {
    await page.goto("/portal/einstellungen");

    await expect(page.locator("h1")).toContainText("Einstellungen");
    await expect(page.locator("text=@sysys35")).toBeVisible();
    await expect(page.locator("text=15%")).toBeVisible();
    await expect(
      page.locator("h2", { hasText: "Profil bearbeiten" }),
    ).toBeVisible();
    await expect(page.locator("input[type='text']")).toHaveValue("Sysys Test");
    await expect(page.locator("input[type='email']")).toHaveValue(
      "sysys@example.com",
    );
    await expect(
      page.locator("h2", { hasText: "Passwort ändern" }),
    ).toBeVisible();
  });

  test("settings profile update shows success", async ({ page }) => {
    await page.goto("/portal/einstellungen");

    const nameInput = page.locator("input[type='text']");
    await nameInput.fill("Sysys Updated");
    await page.getByRole("button", { name: "Speichern" }).click();

    await expect(page.locator("text=Gespeichert")).toBeVisible({
      timeout: 5000,
    });

    // Restore original name
    await nameInput.fill("Sysys Test");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.locator("text=Gespeichert")).toBeVisible({
      timeout: 5000,
    });
  });
});
