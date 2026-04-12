import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Main tests (exclude affiliate specs)
    {
      name: "chromium",
      testIgnore: /affiliate/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Affiliate: setup logs in once and saves cookies
    {
      name: "affiliate-setup",
      testMatch: /affiliate\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Affiliate: auth tests (login/logout flow — needs fresh context, no stored state)
    {
      name: "affiliate-auth",
      testMatch: /affiliate-auth\.spec\.ts/,
      dependencies: ["affiliate-setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // Affiliate: dashboard + API tests (reuse stored login cookies)
    {
      name: "affiliate",
      testMatch: /affiliate-(dashboard|api)\.spec\.ts/,
      dependencies: ["affiliate-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/affiliate.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
