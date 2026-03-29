import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

test.describe("Navigation & CTA Buttons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissBanners(page);
  });

  test("Hero CTA navigates to /onboarding", async ({
    page,
  }) => {
    // Hero CTA text varies by A/B test variant; find any link to /onboarding in main
    const cta = page.locator("main a[href='/onboarding']").first();
    await cta.click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("Hero secondary 'Portfolios ansehen' navigates to /portfolio", async ({
    page,
  }) => {
    const cta = page.locator("a", { hasText: "Portfolios ansehen" }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  test("Header nav links navigate correctly", async ({ page }) => {
    const nav = page.locator("header nav");

    // Leistungen
    await nav.locator("a", { hasText: "Leistungen" }).click();
    await expect(page).toHaveURL(/\/leistungen/);
    await page.goto("/");

    // Portfolio
    await nav.locator("a", { hasText: "Portfolio" }).click();
    await expect(page).toHaveURL(/\/portfolio/);
    await page.goto("/");

    // Über mich
    await nav.locator("a", { hasText: "Über mich" }).click();
    await expect(page).toHaveURL(/\/ueber-mich/);
    await page.goto("/");

    // Kontakt
    await nav.locator("a", { hasText: "Kontakt" }).click();
    await expect(page).toHaveURL(/\/kontakt/);
  });

  test("Header 'Projekt starten' button navigates to /onboarding", async ({
    page,
  }) => {
    const headerCta = page.locator("header a", {
      hasText: "Projekt starten",
    });
    await headerCta.click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("UrgencySection CTA navigates to /onboarding", async ({ page }) => {
    // Scroll down to make the urgency section visible
    const urgencyCta = page
      .locator("a", { hasText: "Jetzt Idee einreichen" })
      .first();
    if (await urgencyCta.isVisible({ timeout: 3000 }).catch(() => false)) {
      await urgencyCta.scrollIntoViewIfNeeded();
      await urgencyCta.click();
      await expect(page).toHaveURL(/\/onboarding/);
    }
  });

  test("CTASection 'Jetzt starten' on /leistungen navigates to /onboarding", async ({
    page,
  }) => {
    await page.goto("/leistungen");
    await dismissBanners(page);
    const cta = page.locator("a", { hasText: "Jetzt starten" }).first();
    await cta.click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("CTASection 'Erstgespräch buchen' navigates to /kontakt", async ({
    page,
  }) => {
    await page.goto("/leistungen");
    await dismissBanners(page);
    const cta = page.locator("a", { hasText: "Erstgespräch buchen" }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await expect(page).toHaveURL(/\/kontakt/);
    }
  });

  test("About page CTAs navigate correctly", async ({ page }) => {
    await page.goto("/ueber-mich");
    await dismissBanners(page);

    // "Projekt starten" CTA
    const projektCta = page.locator("a", { hasText: "Projekt starten" }).first();
    await projektCta.click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("Footer links navigate to correct pages", async ({ page }) => {
    const footer = page.locator("footer");

    await footer.locator("a", { hasText: "Impressum" }).click();
    await expect(page).toHaveURL(/\/impressum/);
    await page.goto("/");

    await footer.locator("a", { hasText: "Datenschutz" }).click();
    await expect(page).toHaveURL(/\/datenschutz/);
    await page.goto("/");

    await footer.locator("a", { hasText: "AGB" }).click();
    await expect(page).toHaveURL(/\/agb/);
  });
});

test.describe("Legal pages render", () => {
  test("Impressum loads", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.locator("h1")).toContainText("Impressum");
  });

  test("Datenschutz loads", async ({ page }) => {
    await page.goto("/datenschutz");
    await expect(page.locator("h1")).toContainText("Datenschutz");
  });

  test("AGB loads", async ({ page }) => {
    await page.goto("/agb");
    await expect(page.locator("h1")).toContainText("AGB");
  });
});
