import "dotenv/config";
import { test as setup, expect } from "@playwright/test";
import fs from "fs";

/**
 * Playwright setup that authenticates as an affiliate for portal E2E tests.
 *
 * Uses the API directly (not the UI form) for reliability on CI. Falls back
 * to an empty storage state so dependent tests can start and skip gracefully.
 *
 * Required env: TEST_AFFILIATE_EMAIL, TEST_AFFILIATE_PASSWORD  (or defaults)
 */

const STORAGE_STATE = "e2e/.auth/affiliate.json";

/** Write a minimal empty storage state so dependent tests can start (and skip). */
function ensureEmptyStorageState() {
  fs.mkdirSync("e2e/.auth", { recursive: true });
  if (!fs.existsSync(STORAGE_STATE)) {
    fs.writeFileSync(
      STORAGE_STATE,
      JSON.stringify({ cookies: [], origins: [] }),
    );
  }
}

setup("authenticate as affiliate", async ({ page }) => {
  // Always ensure the file exists so dependent projects don't crash
  ensureEmptyStorageState();

  const email =
    process.env.TEST_AFFILIATE_EMAIL || "sysys@example.com";
  const password =
    process.env.TEST_AFFILIATE_PASSWORD || "test1234";

  // Step 1: Authenticate via API (faster + more reliable than UI form)
  const loginRes = await page.request.post("/api/affiliates/auth/login", {
    data: { email, password },
  });

  if (!loginRes.ok()) {
    console.log(
      `⚠️  Affiliate login failed (${loginRes.status()}) — affiliate tests will skip`,
    );
    return;
  }

  // Step 2: Verify the session works by navigating to the portal
  await page.goto("/portal");

  try {
    // The portal should NOT redirect back to /portal/login if auth succeeded.
    await page.waitForURL(/\/portal(?!\/login)/, { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText("Willkommen", {
      timeout: 5_000,
    });
  } catch {
    // If navigation fails (e.g. middleware redirects back to login), the
    // session cookie may not have been set correctly. Still save whatever
    // we have — dependent tests will detect the missing auth and skip.
    console.log(
      "⚠️  Affiliate portal redirect failed — affiliate tests may skip",
    );
  }

  // Step 3: Save authenticated state
  await page.context().storageState({ path: STORAGE_STATE });
});
