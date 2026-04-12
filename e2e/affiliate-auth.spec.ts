import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

// Serial — avoid rate limiter (5 login attempts per 15min per IP)
test.describe.configure({ mode: "serial" });

test.describe("Affiliate Auth", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/portal/login");
    await dismissBanners(page);

    await expect(page.locator("h1")).toContainText("Partner Login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anmelden" }),
    ).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/portal/login");
    await dismissBanners(page);

    await page.locator("input[type='email']").fill("sysys@example.com");
    await page.locator("input[type='password']").fill("wrongpassword");
    await page.getByRole("button", { name: "Anmelden" }).click();

    const error = page.locator("[class*='red']", {
      hasText: "Ungültige Anmeldedaten",
    });
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/portal\/login/);
  });

  test("login with non-existent email shows error", async ({ page }) => {
    await page.goto("/portal/login");
    await dismissBanners(page);

    await page.locator("input[type='email']").fill("nobody@example.com");
    await page.locator("input[type='password']").fill("test1234");
    await page.getByRole("button", { name: "Anmelden" }).click();

    const error = page.locator("[class*='red']", {
      hasText: "Ungültige Anmeldedaten",
    });
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await page.goto("/portal/login");
    await dismissBanners(page);

    await page.locator("input[type='email']").fill("sysys@example.com");
    await page.locator("input[type='password']").fill("test1234");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.waitForURL(/\/portal(?!\/login)/, { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText("Willkommen", {
      timeout: 5_000,
    });
  });

  test("logout returns to login page", async ({ page }) => {
    // Login first
    await page.goto("/portal/login");
    await dismissBanners(page);
    await page.locator("input[type='email']").fill("sysys@example.com");
    await page.locator("input[type='password']").fill("test1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/portal(?!\/login)/, { timeout: 15_000 });

    // Logout via sidebar button
    await page
      .locator("aside button", { hasText: "Abmelden" })
      .click();
    await page.waitForURL(/\/portal\/login/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Partner Login");
  });

  test("unauthenticated API access returns 401", async ({ request }) => {
    const res = await request.get("/api/affiliates/me");
    expect(res.status()).toBe(401);
  });
});
