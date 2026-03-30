/**
 * TOTP (Time-based One-Time Password) handling.
 * Compatible with Google Authenticator, Authy, etc.
 *
 * The TOTP secret is stored in the database (AdminSetting table)
 * with fallback to ADMIN_TOTP_SECRET env var for backwards compatibility.
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

const ISSUER = "NanaChimi Digital";
const TOTP_SETTING_KEY = "admin_totp_secret";

function createTOTP(secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: "Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/**
 * Get the stored TOTP secret (DB first, then env fallback).
 */
async function getStoredSecret(): Promise<string | null> {
  // 1. Try database
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: TOTP_SETTING_KEY },
    });
    if (setting?.value) return setting.value;
  } catch {
    // Table might not exist yet during migration
  }

  // 2. Fallback to env var
  return process.env.ADMIN_TOTP_SECRET || null;
}

/**
 * Save the TOTP secret to the database.
 */
export async function saveTOTPSecret(secret: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { key: TOTP_SETTING_KEY },
    update: { value: secret },
    create: { key: TOTP_SETTING_KEY, value: secret },
  });
}

/**
 * Verify a TOTP code against the stored secret.
 */
export async function verifyTOTP(code: string): Promise<boolean> {
  const secret = await getStoredSecret();
  if (!secret) {
    console.error("[Auth] No TOTP secret configured");
    return false;
  }
  const totp = createTOTP(secret);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

/**
 * Check if TOTP is already configured (secret exists in DB or env).
 */
export async function isTOTPConfigured(): Promise<boolean> {
  const secret = await getStoredSecret();
  return !!secret;
}

/**
 * Generate a new TOTP enrollment (secret + QR code).
 * Used during first-time 2FA setup.
 */
export async function generateEnrollment(): Promise<{
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}> {
  const secretObj = new OTPAuth.Secret({ size: 20 });
  const secret = secretObj.base32;

  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: "Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secretObj,
  });

  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, otpauthUrl, qrDataUrl };
}

/**
 * Verify a code against a specific secret (for enrollment confirmation).
 */
export function verifyTOTPWithSecret(code: string, secret: string): boolean {
  const totp = createTOTP(secret);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
