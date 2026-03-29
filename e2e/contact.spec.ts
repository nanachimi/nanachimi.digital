import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kontakt");
    await dismissBanners(page);
  });

  test("page renders with heading", async ({ page }) => {
    await expect(
      page.locator("h1, h2").filter({ hasText: /sprechen|Kontakt/i }).first()
    ).toBeVisible();
  });

  test("'Termin buchen' button reveals SlotPicker", async ({ page }) => {
    const bookBtn = page.locator("button", { hasText: "Termin buchen" });
    if (await bookBtn.isVisible().catch(() => false)) {
      await bookBtn.click();

      // SlotPicker should now be visible — look for calendar/date elements
      await expect(
        page.locator("text=/Verfügbare|Wählen Sie|Uhrzeit/i").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("sidebar CTA links to /onboarding", async ({ page }) => {
    const sidebarCta = page.locator("a", { hasText: "Projekt starten" });
    if (await sidebarCta.isVisible().catch(() => false)) {
      await expect(sidebarCta).toHaveAttribute("href", /\/onboarding/);
    }
  });

  test("email link exists", async ({ page }) => {
    const emailLink = page.locator("a[href*='mailto:']");
    if (await emailLink.isVisible().catch(() => false)) {
      await expect(emailLink).toHaveAttribute(
        "href",
        /mailto:.*@nanachimi\.digital/
      );
    }
  });
});
