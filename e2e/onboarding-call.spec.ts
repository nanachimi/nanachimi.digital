import { test, expect } from "@playwright/test";
import { dismissBanners, fillOnboardingSteps } from "./helpers/onboarding";

test.describe("Onboarding — Call Flow", () => {
  test("complete Call flow redirects to bestaetigung with SlotPicker", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/onboarding");
    await dismissBanners(page);

    // Fill steps 1–11
    await fillOnboardingSteps(page, {
      name: "Anna Test",
      email: "anna@example.com",
    });

    // Step 12: Select "Persönlich besprechen"
    await page
      .locator("button[type='button']", { hasText: "Persönlich besprechen" })
      .click();

    // Submit
    const submitBtn = page.locator("button", {
      hasText: "Angebot anfordern",
    });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify redirect to call confirmation
    await page.waitForURL(/\/onboarding\/bestaetigung\?typ=call&sid=/);
    await expect(page.locator("h1, h2").first()).toContainText("Vielen Dank");

    // Verify booking-related content is visible
    await expect(
      page.locator("text=/Termin|buchen|Gespräch/i").first()
    ).toBeVisible();
  });
});
