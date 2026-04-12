/**
 * Affiliate session management using iron-session.
 * Separate from admin session — different cookie, different secret.
 */

import { SessionOptions } from "iron-session";

export interface AffiliateSessionData {
  isLoggedIn: boolean;
  affiliateId: string;
  email: string;
  handle: string;
  loginAt: number;       // epoch ms — absolute expiry anchor
  lastActivity: number;  // epoch ms — inactivity expiry anchor
}

export const defaultAffiliateSession: AffiliateSessionData = {
  isLoggedIn: false,
  affiliateId: "",
  email: "",
  handle: "",
  loginAt: 0,
  lastActivity: 0,
};

export const AFFILIATE_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;   // 24 hours absolute
export const AFFILIATE_SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;   // 1 hour inactivity

export const affiliateSessionOptions: SessionOptions = {
  password: process.env.AFFILIATE_SESSION_SECRET || "unsafe-affiliate-dev-secret-must-be-at-least-32-chars",
  cookieName: "ncd-affiliate-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60, // 24h in seconds (cookie TTL)
  },
};

/**
 * Check if an affiliate session is still valid (not expired).
 */
export function isAffiliateSessionValid(session: AffiliateSessionData): boolean {
  if (!session.isLoggedIn) return false;

  const now = Date.now();

  // Absolute expiry: 24 hours from login
  if (now - session.loginAt > AFFILIATE_SESSION_MAX_AGE_MS) return false;

  // Inactivity expiry: 1 hour since last activity
  if (now - session.lastActivity > AFFILIATE_SESSION_IDLE_TIMEOUT_MS) return false;

  return true;
}
