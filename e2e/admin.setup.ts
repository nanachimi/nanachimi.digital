import "dotenv/config";
import { test as setup, expect } from "@playwright/test";
import * as OTPAuth from "otpauth";
import fs from "fs";

/**
 * Playwright setup that authenticates as admin for backoffice E2E tests.
 *
 * Handles the full login flow:
 *   1. POST username + password
 *   2. TOTP verification (or first-time 2FA setup)
 *   3. Save session cookies to storage state file
 *
 * Required env vars: ADMIN_USERNAME, ADMIN_PASSWORD, DATABASE_URL
 * Optional env var:  ADMIN_TOTP_SECRET (falls back to DB lookup)
 */

const STORAGE_STATE = "e2e/.auth/admin.json";

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

// ---------------------------------------------------------------------------
// TOTP helpers
// ---------------------------------------------------------------------------

async function getTotpSecret(): Promise<string | undefined> {
  // 1. Try env var
  if (process.env.ADMIN_TOTP_SECRET) return process.env.ADMIN_TOTP_SECRET;

  // 2. Try DB lookup
  try {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    const prisma = new PrismaClient({ adapter });
    const setting = await (prisma as unknown as {
      adminSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null> };
    }).adminSetting.findUnique({
      where: { key: "admin_totp_secret" },
    });
    await prisma.$disconnect();
    return setting?.value ?? undefined;
  } catch {
    return undefined;
  }
}

function generateTotpCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: "NanaChimi Digital",
    label: "Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.generate();
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

setup("authenticate as admin", async ({ page }) => {
  // Always ensure the file exists so dependent projects don't crash
  ensureEmptyStorageState();

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log("⚠️  ADMIN_USERNAME / ADMIN_PASSWORD not set — admin tests will skip");
    return;
  }

  // Step 1: Login with credentials
  const loginRes = await page.request.post("/api/admin/auth/login", {
    data: { username, password },
  });

  if (!loginRes.ok()) {
    console.log(`⚠️  Admin login failed (${loginRes.status()}) — admin tests will skip`);
    return;
  }

  const loginData = await loginRes.json();

  // Step 2: Handle TOTP
  if (loginData.next === "totp") {
    const secret = await getTotpSecret();
    if (!secret) {
      console.log("⚠️  TOTP secret not available — admin tests will skip");
      return;
    }
    const code = generateTotpCode(secret);
    const verifyRes = await page.request.post("/api/admin/auth/verify-totp", {
      data: { code },
    });
    expect(verifyRes.ok()).toBe(true);
  } else if (loginData.next === "setup-2fa") {
    // First-time 2FA enrolment
    const enrollRes = await page.request.get("/api/admin/auth/setup-totp");
    expect(enrollRes.ok()).toBe(true);
    const enrollData = await enrollRes.json();

    const code = generateTotpCode(enrollData.secret);
    const confirmRes = await page.request.post("/api/admin/auth/setup-totp", {
      data: { code, secret: enrollData.secret },
    });
    expect(confirmRes.ok()).toBe(true);
  }

  // Step 3: Verify access — should NOT redirect to login
  await page.goto("/backoffice");
  await page.waitForURL(/\/backoffice(?!\/login)/, { timeout: 15_000 });

  // Step 4: Save authenticated state
  await page.context().storageState({ path: STORAGE_STATE });
});
