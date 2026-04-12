import { test as setup, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

const STORAGE_STATE = "e2e/.auth/affiliate.json";

setup("authenticate as affiliate", async ({ page }) => {
  await page.goto("/portal/login");
  await dismissBanners(page);

  await page.locator("input[type='email']").fill("sysys@example.com");
  await page.locator("input[type='password']").fill("test1234");
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Wait for redirect to dashboard (exclude /portal/login)
  await page.waitForURL(/\/portal(?!\/login)/, { timeout: 15_000 });
  await expect(page.locator("h1")).toContainText("Willkommen", {
    timeout: 5_000,
  });

  // Save signed-in state
  await page.context().storageState({ path: STORAGE_STATE });
});
