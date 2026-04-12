import { type Page } from "@playwright/test";
import { dismissBanners } from "./onboarding";

/**
 * Log in as an affiliate via the /portal/login page.
 * After calling this, the browser is on the affiliate dashboard (/portal).
 */
export async function affiliateLogin(
  page: Page,
  email = "sysys@example.com",
  password = "test1234",
) {
  await page.goto("/portal/login");
  await dismissBanners(page);

  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/portal/, { timeout: 10_000 });
}
