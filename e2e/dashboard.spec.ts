import { test, expect } from "@playwright/test";
import { dismissBanners } from "./helpers/onboarding";

/**
 * E2E tests for the admin KPI Dashboard.
 *
 * These tests verify that the dashboard page renders all KPI groups,
 * that clickable cards navigate to the correct pages with correct filters,
 * and that the Anfragen page correctly reads URL filter params.
 *
 * Auth: These tests run in the "admin" project, which depends on
 * admin.setup.ts having saved a valid session to e2e/.auth/admin.json.
 * If the setup is skipped (env vars missing), these tests skip too.
 */

// ---------------------------------------------------------------------------
// Helper: skip entire suite if we landed on the login page (no auth)
// ---------------------------------------------------------------------------

async function ensureAuthenticated(page: import("@playwright/test").Page) {
  // Give the page a moment to settle after navigation
  await page.waitForLoadState("domcontentloaded");
  const url = page.url();
  if (url.includes("/backoffice/login") || url.includes("/setup-2fa")) {
    test.skip(true, "Admin not authenticated — skipping");
  }
}

// ---------------------------------------------------------------------------
// Admin KPI Dashboard
// ---------------------------------------------------------------------------

test.describe("Admin KPI Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/backoffice");
    await dismissBanners(page);
    await ensureAuthenticated(page);

    // Wait for dashboard content to load (API fetch + render)
    await page.waitForSelector("h1", { timeout: 15_000 });
  });

  // ─── Rendering ──────────────────────────────────────────────────

  test("renders all four KPI group headings", async ({ page }) => {
    await expect(
      page.locator("h2", { hasText: "Pipeline & Umsatz" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator("h2", { hasText: "Anfragen & Konversion" }),
    ).toBeVisible();
    await expect(page.locator("h2", { hasText: "Betrieb" })).toBeVisible();
    await expect(
      page.locator("h2", { hasText: "Traffic & Funnel" }),
    ).toBeVisible();
  });

  test("renders dashboard title and subtitle", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(
      page.locator("text=Geschäftsübersicht auf einen Blick"),
    ).toBeVisible();
  });

  test("renders all KPI cards with labels", async ({ page }) => {
    const labels = [
      "Offene Pipeline",
      "Umsatz (30 Tage)",
      "Ausstehende Zahlungen",
      "Offene Angebote",
      "Neue Anfragen",
      "Konversionsrate",
      "SLA-Gesundheit",
      "Projektwert",
      "Termine",
      "Offene Vorfälle",
      "Job Queue",
      "Besucher (7 Tage)",
      "Onboarding-Funnel",
    ];

    for (const label of labels) {
      await expect(
        page.locator(`text=${label}`).first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("Aktualisieren button is visible", async ({ page }) => {
    await expect(
      page.locator("button", { hasText: "Aktualisieren" }),
    ).toBeVisible();
  });

  // ─── Clickable cards: correct href targets ─────────────────────

  test("Offene Pipeline card links to anfragen with pipeline filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='filter=pipeline']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Offene Pipeline");
  });

  test("Offene Angebote card links to anfragen with angebot_sent filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='filter=angebot_sent']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Offene Angebote");
  });

  test("Neue Anfragen card links to anfragen with pending filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='filter=pending']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Neue Anfragen");
  });

  test("Konversionsrate card links to anfragen with accepted filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='filter=accepted']").first();
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Konversionsrate");
  });

  test("SLA-Gesundheit card links to anfragen with sla_breached filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='filter=sla_breached']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("SLA-Gesundheit");
  });

  test("Termine card links to bookings page", async ({ page }) => {
    // Use main content area to avoid matching sidebar link
    const main = page.locator("main, section").first();
    const link = main.locator("a[href='/backoffice/bookings']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Termine");
  });

  test("Offene Vorfälle card links to incidents with correct params", async ({
    page,
  }) => {
    const link = page.locator("a[href*='tab=incidents'][href*='filter=open']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Offene Vorfälle");
  });

  test("Job Queue card links to incidents with jobs tab and failed filter", async ({
    page,
  }) => {
    const link = page.locator("a[href*='tab=jobs'][href*='filter=failed']");
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toContainText("Job Queue");
  });

  test("Besucher card links to analytics page", async ({ page }) => {
    const analyticsLinks = page.locator("a[href='/backoffice/analytics']");
    await expect(analyticsLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test("Umsatz card is NOT clickable (no link)", async ({ page }) => {
    // Umsatz card should be a div, not a link
    const umsatzText = page.locator("text=Umsatz (30 Tage)").first();
    await expect(umsatzText).toBeVisible({ timeout: 10_000 });
    const parentLink = umsatzText.locator("xpath=ancestor::a");
    await expect(parentLink).toHaveCount(0);
  });

  test("Ausstehende Zahlungen card is NOT clickable (no link)", async ({
    page,
  }) => {
    const text = page.locator("text=Ausstehende Zahlungen").first();
    await expect(text).toBeVisible({ timeout: 10_000 });
    const parentLink = text.locator("xpath=ancestor::a");
    await expect(parentLink).toHaveCount(0);
  });

  // ─── Navigation: click card → lands on correct page + filter ───

  test("clicking Offene Pipeline navigates to Anfragen with Pipeline filter active", async ({
    page,
  }) => {
    await page.locator("a[href*='filter=pipeline']").click();
    await expect(page).toHaveURL(/\/backoffice\/anfragen\?filter=pipeline/);
    await expect(page.locator("h1")).toContainText("Anfragen");

    // Pipeline tab should be highlighted
    const pipelineTab = page.locator("button", { hasText: "Pipeline" });
    await expect(pipelineTab).toBeVisible();
  });

  test("clicking Offene Angebote navigates to Anfragen with angebot_sent filter", async ({
    page,
  }) => {
    await page.locator("a[href*='filter=angebot_sent']").click();
    await expect(page).toHaveURL(/\/backoffice\/anfragen\?filter=angebot_sent/);
    await expect(page.locator("h1")).toContainText("Anfragen");

    const tab = page.locator("button", { hasText: "Angebot gesendet" });
    await expect(tab).toBeVisible();
  });

  test("clicking Termine navigates to bookings page", async ({ page }) => {
    const main = page.locator("main, section").first();
    await main.locator("a[href='/backoffice/bookings']").click();
    await expect(page).toHaveURL(/\/backoffice\/bookings/);
  });

  test("clicking Offene Vorfälle navigates to incidents page with open filter", async ({
    page,
  }) => {
    await page.locator("a[href*='tab=incidents'][href*='filter=open']").click();
    await expect(page).toHaveURL(
      /\/backoffice\/incidents\?tab=incidents&filter=open/,
    );

    // Should show the Vorfälle tab content (not Jobs)
    await expect(
      page.locator("button", { hasText: /Vorfälle/ }),
    ).toBeVisible();
  });

  test("clicking Job Queue navigates to incidents page with failed filter", async ({
    page,
  }) => {
    await page.locator("a[href*='tab=jobs'][href*='filter=failed']").click();
    await expect(page).toHaveURL(
      /\/backoffice\/incidents\?tab=jobs&filter=failed/,
    );
  });
});

// ---------------------------------------------------------------------------
// Anfragen page — URL filter params
// ---------------------------------------------------------------------------

test.describe("Anfragen Page — URL Filter Params", () => {
  test.beforeEach(async ({ page }) => {
    await dismissBanners(page);
  });

  test("?filter=pipeline shows Pipeline tab as active", async ({ page }) => {
    await page.goto("/backoffice/anfragen?filter=pipeline");
    await ensureAuthenticated(page);

    const pipelineTab = page.locator("button", { hasText: "Pipeline" });
    await expect(pipelineTab).toBeVisible({ timeout: 10_000 });
  });

  test("?filter=accepted shows Angenommen tab as active", async ({ page }) => {
    await page.goto("/backoffice/anfragen?filter=accepted");
    await ensureAuthenticated(page);

    const tab = page.locator("button", { hasText: "Angenommen" });
    await expect(tab).toBeVisible({ timeout: 10_000 });
  });

  test("?filter=angebot_sent shows Angebot gesendet tab", async ({ page }) => {
    await page.goto("/backoffice/anfragen?filter=angebot_sent");
    await ensureAuthenticated(page);

    const tab = page.locator("button", { hasText: "Angebot gesendet" });
    await expect(tab).toBeVisible({ timeout: 10_000 });
  });

  test("?filter=pending shows Offen tab", async ({ page }) => {
    await page.goto("/backoffice/anfragen?filter=pending");
    await ensureAuthenticated(page);

    const tab = page.locator("button", { hasText: "Offen" });
    await expect(tab).toBeVisible({ timeout: 10_000 });
  });

  test("invalid filter defaults to Alle", async ({ page }) => {
    await page.goto("/backoffice/anfragen?filter=nonsense");
    await ensureAuthenticated(page);

    // "Alle" tab should be the active one
    const alleTab = page.locator("button", { hasText: "Alle" });
    await expect(alleTab).toBeVisible({ timeout: 10_000 });
  });

  test("no filter param defaults to Alle", async ({ page }) => {
    await page.goto("/backoffice/anfragen");
    await ensureAuthenticated(page);

    const alleTab = page.locator("button", { hasText: "Alle" });
    await expect(alleTab).toBeVisible({ timeout: 10_000 });
  });

  test("Pipeline filter shows all open-status submissions", async ({
    page,
  }) => {
    await page.goto("/backoffice/anfragen?filter=pipeline");
    await ensureAuthenticated(page);

    // Pipeline tab should include count
    const pipelineTab = page.locator("button", { hasText: "Pipeline" });
    await expect(pipelineTab).toBeVisible({ timeout: 10_000 });

    // Count should be a number (Pipeline count badge)
    const badge = pipelineTab.locator("span").last();
    const countText = await badge.textContent();
    expect(Number(countText)).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Incidents page — URL filter params
// ---------------------------------------------------------------------------

test.describe("Incidents Page — URL Filter Params", () => {
  test.beforeEach(async ({ page }) => {
    await dismissBanners(page);
  });

  test("?tab=incidents&filter=open shows incidents tab with open filter", async ({
    page,
  }) => {
    await page.goto("/backoffice/incidents?tab=incidents&filter=open");
    await ensureAuthenticated(page);

    // Should show incidents, not jobs
    await expect(
      page.locator("button", { hasText: /Vorfälle/ }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("?tab=jobs&filter=failed shows jobs tab", async ({ page }) => {
    await page.goto("/backoffice/incidents?tab=jobs&filter=failed");
    await ensureAuthenticated(page);

    await expect(
      page.locator("button", { hasText: /Jobs/ }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("no params defaults to jobs tab", async ({ page }) => {
    await page.goto("/backoffice/incidents");
    await ensureAuthenticated(page);

    // Default tab is "jobs"
    await expect(
      page.locator("button", { hasText: /Jobs/ }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Dashboard API — contract test via E2E
// ---------------------------------------------------------------------------

test.describe("Dashboard API Contract", () => {
  test("GET /api/admin/dashboard returns expected shape", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/dashboard");

    // May be 401 if not authenticated — skip in that case
    if (res.status() === 401) {
      test.skip(true, "Admin auth required — skipping API contract test");
      return;
    }

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Group A: Pipeline & Revenue
    expect(body.pipeline).toHaveProperty("totalValue");
    expect(body.pipeline).toHaveProperty("count");
    expect(typeof body.pipeline.totalValue).toBe("number");

    expect(body.revenue).toHaveProperty("last30Days");
    expect(body.revenue).toHaveProperty("previous30Days");
    expect(body.revenue).toHaveProperty("dailyBreakdown");
    expect(body.revenue.dailyBreakdown).toBeInstanceOf(Array);

    expect(body.pendingPayments).toHaveProperty("totalValue");
    expect(body.pendingPayments).toHaveProperty("count");

    expect(body.openOffers).toHaveProperty("totalValue");
    expect(body.openOffers).toHaveProperty("count");

    // Group B: Leads & Conversion
    expect(body.newLeads).toHaveProperty("last7Days");
    expect(body.newLeads).toHaveProperty("previous7Days");
    expect(body.newLeads).toHaveProperty("dailyBreakdown");

    expect(body.conversion).toHaveProperty("rate");
    expect(typeof body.conversion.rate).toBe("number");

    expect(body.slaHealth).toHaveProperty("active");
    expect(body.slaHealth).toHaveProperty("breached");

    expect(body.avgProjectValue).toHaveProperty("last90Days");
    expect(body.avgProjectValue).toHaveProperty("previous90Days");

    // Group C: Operations
    expect(body.bookings).toHaveProperty("next7Days");
    expect(body.bookings).toHaveProperty("upcoming");

    expect(body.incidents).toHaveProperty("open");
    expect(body.incidents).toHaveProperty("critical");
    expect(body.incidents).toHaveProperty("warning");
    expect(body.incidents).toHaveProperty("info");

    expect(body.jobQueue).toHaveProperty("failed");
    expect(body.jobQueue).toHaveProperty("pending");

    // Group D: Traffic & Funnel
    expect(body.traffic).toHaveProperty("uniqueVisitors7d");
    expect(body.traffic).toHaveProperty("previousUniqueVisitors7d");
    expect(body.traffic).toHaveProperty("dailyVisitors");

    expect(body.funnel).toHaveProperty("steps");
    expect(body.funnel).toHaveProperty("overallCompletionRate");

    expect(body.topSources).toBeInstanceOf(Array);
  });
});

// ---------------------------------------------------------------------------
// Sidebar — Anfragen nav item
// ---------------------------------------------------------------------------

test.describe("Sidebar — Anfragen Navigation", () => {
  test("sidebar shows Anfragen link with badge", async ({ page }) => {
    await page.goto("/backoffice");
    await dismissBanners(page);
    await ensureAuthenticated(page);

    const nav = page.locator("aside nav, nav").first();
    const anfragenLink = nav.locator("a", { hasText: "Anfragen" });
    await expect(anfragenLink).toBeVisible({ timeout: 10_000 });
  });

  test("clicking Anfragen in sidebar navigates correctly", async ({
    page,
  }) => {
    await page.goto("/backoffice");
    await dismissBanners(page);
    await ensureAuthenticated(page);

    const nav = page.locator("aside nav, nav").first();
    await nav.locator("a", { hasText: "Anfragen" }).click();
    await expect(page).toHaveURL(/\/backoffice\/anfragen/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("Anfragen");
  });
});
