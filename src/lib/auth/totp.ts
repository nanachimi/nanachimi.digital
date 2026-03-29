/**
 * TOTP (Time-based One-Time Password) handling.
 * Compatible with Google Authenticator, Authy, etc.
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "NanaChimi Digital";

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
 * Verify a TOTP code against the stored secret.
 */
export function verifyTOTP(code: string): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) {
    console.error("[Auth] ADMIN_TOTP_SECRET not set");
    return false;
  }
  const totp = createTOTP(secret);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

/**
 * Check if TOTP is already configured (secret exists in env).
 */
export function isTOTPConfigured(): boolean {
  return !!process.env.ADMIN_TOTP_SECRET;
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
