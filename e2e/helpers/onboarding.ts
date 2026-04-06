import { type Page, expect } from "@playwright/test";

/**
 * Dismiss cookie consent and session storage consent banners if visible.
 */
export async function dismissBanners(page: Page) {
  // Wait for page load + hydration before interacting
  await page.waitForLoadState("domcontentloaded");

  // Cookie consent
  const cookieBtn = page.locator("button", { hasText: "Alle akzeptieren" });
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  // Session storage consent
  const sessionBtn = page.locator("button", { hasText: "Ja, speichern" });
  if (await sessionBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sessionBtn.click();
    await sessionBtn.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  }
}

/**
 * Fill onboarding steps 1–11 with valid data.
 * After calling this, the form is on step 12 (Abschluss).
 */
export async function fillOnboardingSteps(
  page: Page,
  options?: {
    projekttyp?: string;
    beschreibung?: string;
    zielgruppe?: string;
    features?: string[];
    customFeature?: string;
    rollenAnzahl?: string;
    designLevel?: string;
    markenname?: string;
    zeitrahmenMvp?: string;
    zeitrahmenFinal?: string;
    budget?: string;
    betrieb?: string;
    name?: string;
    email?: string;
  }
) {
  const weiter = page.getByRole("button", { name: "Weiter", exact: true });

  // Step 1: Projekttyp
  const projekttyp = options?.projekttyp ?? "Etwas im Browser";
  await page.locator("button[type='button']", { hasText: projekttyp }).click();
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 2: Beschreibung
  const beschreibung =
    options?.beschreibung ?? "Ein Online-Portal für Terminbuchungen und Kundenverwaltung.";
  await page.locator("textarea").fill(beschreibung);
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 3: Zielgruppe
  const zielgruppe =
    options?.zielgruppe ?? "Kleine und mittlere Unternehmen in Deutschland";
  await page.locator("textarea").fill(zielgruppe);
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 4: Funktionen — click at least one predefined feature
  const featureLabels = options?.features ?? [
    "Anmeldung & Benutzerkonten",
    "Suche & Filter",
  ];
  for (const label of featureLabels) {
    await page.locator("button[type='button']", { hasText: label }).click();
  }

  // Optionally add a custom feature
  if (options?.customFeature) {
    const input = page.locator("input[placeholder*='Kalender']");
    await input.fill(options.customFeature);
    await page.locator("button", { hasText: "Hinzufügen" }).click();
  }

  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 5: Nutzerrollen — labels: "Nur ich / eine Gruppe", "Zwei Gruppen", "Drei oder mehr Gruppen"
  const rollenMap: Record<string, string> = {
    "1": "Nur ich",
    "2": "Zwei Gruppen",
    "3+": "Drei oder mehr",
  };
  const rollenLabel = rollenMap[options?.rollenAnzahl ?? "1"] ?? "Nur ich";
  await page
    .locator("button[type='button']", { hasText: rollenLabel })
    .first()
    .click();
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 6: Design — labels: "Sauber & funktional", "Nach meinen Vorgaben", "Besonders & hochwertig"
  const designMap: Record<string, string> = {
    standard: "Sauber & funktional",
    individuell: "Nach meinen Vorgaben",
    premium: "Besonders & hochwertig",
  };
  const designLabel = designMap[options?.designLevel ?? "standard"] ?? "Sauber & funktional";
  await page
    .locator("button[type='button']", { hasText: designLabel })
    .first()
    .click();
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 7: Branding (all optional — just proceed)
  if (options?.markenname) {
    await page.locator("#markenname").fill(options.markenname);
  }
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 8: Zeitrahmen
  // MVP labels: "So schnell wie möglich", "In 1–2 Wochen", "In einem Monat", "Kein fester Termin"
  // Final labels: "1 Monat", "2–3 Monate", "6 Monate", "Laufend"
  const mvpLabel = options?.zeitrahmenMvp ?? "Kein fester Termin";
  const finalLabel = options?.zeitrahmenFinal ?? "2–3 Monate";
  const mvpBtn = page.locator("button[type='button']", { hasText: mvpLabel }).first();
  await mvpBtn.scrollIntoViewIfNeeded();
  await mvpBtn.click();
  const finalBtn = page.locator("button[type='button']", { hasText: finalLabel }).first();
  await finalBtn.scrollIntoViewIfNeeded();
  await finalBtn.click();
  await expect(weiter).toBeEnabled({ timeout: 5000 });
  await weiter.scrollIntoViewIfNeeded();
  await weiter.click();

  // Step 9: Budget — labels: "Unter 399 €", "399 – 1.000 €", "1.000 – 5.000 €", etc.
  const budgetLabel = options?.budget ?? "1.000 – 5.000";
  await page
    .locator("button[type='button']", { hasText: budgetLabel })
    .first()
    .click();
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 10: Betrieb & Wartung
  const betriebLabel = options?.betrieb ?? "Nein, nur den";
  await page
    .locator("button[type='button']", { hasText: betriebLabel })
    .first()
    .click();
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Step 11: Kontaktdaten — email first (name field appears only after valid email)
  const name = options?.name ?? "Test Nutzer";
  const email = options?.email ?? "test@example.com";
  await page.locator("input[type='email']").fill(email);
  // Wait for name field to appear (conditionally rendered after email is valid)
  const nameInput = page.locator("input").filter({ hasNot: page.locator("[type='email']") }).last();
  await nameInput.waitFor({ state: "visible", timeout: 5000 });
  await nameInput.fill(name);
  await expect(weiter).toBeEnabled();
  await weiter.click();

  // Now on step 12 — Abschluss
}
