import { test, expect } from "@playwright/test";

test.describe("Angebot View", () => {
  test("non-existent Angebot returns error or 404", async ({ request }) => {
    const res = await request.get("/api/angebot/nonexistent-id");
    expect([404, 500]).toContain(res.status());
  });

  test("Angebot page for invalid ID shows error state", async ({ page }) => {
    await page.goto("/angebot/invalid-test-id");

    // Should show some error state — not found or loading
    await expect(
      page
        .locator(
          "text=/nicht gefunden|Fehler|not found|wird erstellt|lädt/i"
        )
        .first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Angebot API", () => {
  test("PATCH with invalid action returns error", async ({ request }) => {
    const res = await request.patch("/api/angebot/nonexistent-id", {
      data: { action: "accept" },
    });
    // Should fail since the Angebot doesn't exist
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
