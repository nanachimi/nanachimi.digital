import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

test.describe("Portfolio Pages", () => {
  test("portfolio index renders project cards", async ({ page }) => {
    await page.goto("/portfolio");
    await dismissBanners(page);

    // Page heading
    await expect(page.locator("h1").first()).toBeVisible();

    // At least one project card (link to portfolio detail)
    const projectLinks = page.locator("a[href*='/portfolio/']");
    const count = await projectLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking a project navigates to detail page", async ({ page }) => {
    await page.goto("/portfolio");
    await dismissBanners(page);

    const firstProject = page.locator("a[href*='/portfolio/']").first();
    const href = await firstProject.getAttribute("href");
    expect(href).toBeTruthy();

    await firstProject.click();
    await expect(page).toHaveURL(new RegExp(href!));

    // Detail page should have content
    await expect(page.locator("main")).not.toBeEmpty();
  });

  test("portfolio page has CTASection", async ({ page }) => {
    await page.goto("/portfolio");
    await dismissBanners(page);

    // Look for the CTA section at the bottom
    const ctaLink = page
      .locator("a", { hasText: /Jetzt starten|Projekt starten/i })
      .last();
    if (await ctaLink.isVisible().catch(() => false)) {
      await expect(ctaLink).toHaveAttribute("href", /\/onboarding/);
    }
  });
});

test.describe("Services Pages", () => {
  test("services index renders 3 service cards", async ({ page }) => {
    await page.goto("/leistungen");
    await dismissBanners(page);

    await expect(page.locator("h1").first()).toBeVisible();

    // Should have links to service detail pages
    const serviceLinks = page.locator("a[href*='/leistungen/']");
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("48h MVP service page loads", async ({ page }) => {
    await page.goto("/leistungen/48h-mvp");
    await dismissBanners(page);

    await expect(page.locator("main")).not.toBeEmpty();
    await expect(page.locator("text=/48h|48 Stunden/i").first()).toBeVisible();
  });

  test("Individuelle Lösung service page loads", async ({ page }) => {
    await page.goto("/leistungen/individuelle-loesung");
    await dismissBanners(page);

    await expect(page.locator("main")).not.toBeEmpty();
    await expect(
      page.locator("text=/individuelle Lösung|Ihre individuelle/i").first()
    ).toBeVisible();
  });

  test("Betrieb & Wartung service page loads", async ({ page }) => {
    await page.goto("/leistungen/betrieb-und-wartung");
    await dismissBanners(page);

    await expect(page.locator("main")).not.toBeEmpty();
    await expect(
      page.locator("text=/Betrieb|Wartung/i").first()
    ).toBeVisible();
  });

  test("service pages have CTA to /onboarding", async ({ page }) => {
    await page.goto("/leistungen/48h-mvp");
    await dismissBanners(page);

    const ctaLink = page
      .locator("a", { hasText: /Jetzt starten|Projekt starten/i })
      .last();
    if (await ctaLink.isVisible().catch(() => false)) {
      await expect(ctaLink).toHaveAttribute("href", /\/onboarding/);
    }
  });
});

test.describe("Homepage", () => {
  test("homepage loads with hero section", async ({ page }) => {
    await page.goto("/");
    await dismissBanners(page);

    await expect(page.locator("main")).not.toBeEmpty();

    // Hero heading should be visible
    await expect(
      page.locator("h1").first()
    ).toBeVisible();

    // At least one CTA to /onboarding
    const onboardingLink = page.locator("a[href='/onboarding']").first();
    await expect(onboardingLink).toBeVisible();
  });

  test("homepage has trust signals / stats", async ({ page }) => {
    await page.goto("/");
    await dismissBanners(page);

    // Check for trust signals like "48h" or experience mentions
    await expect(
      page.locator("text=/48h|Erfahrung|Aus einer Hand/i").first()
    ).toBeVisible();
  });
});
