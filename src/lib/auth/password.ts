/**
 * Password verification for admin authentication.
 * Uses ADMIN_PASSWORD env var (server-side only, never exposed to client).
 * Comparison uses constant-time equality to prevent timing attacks.
 */

import crypto from "crypto";

/**
 * Timing-safe string comparison.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, "utf8"),
      Buffer.from(b, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Timing-safe username comparison.
 */
export function verifyUsername(input: string): boolean {
  const expected = process.env.ADMIN_USERNAME || "";
  return timingSafeCompare(input, expected);
}

/**
 * Verify password against ADMIN_PASSWORD env var.
 * Uses constant-time comparison for security.
 */
export async function verifyPassword(plain: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("[Auth] ADMIN_PASSWORD not set in environment");
    return false;
  }
  return timingSafeCompare(plain, expected);
}
