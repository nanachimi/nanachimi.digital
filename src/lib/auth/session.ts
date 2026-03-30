/**
 * Session management using iron-session.
 * Encrypted cookie — no external session store needed.
 */

import { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
  is2FAVerified: boolean;
  totpConfigured: boolean; // cached from DB at login time
  username: string;
  loginAt: number;       // epoch ms — absolute expiry anchor
  lastActivity: number;  // epoch ms — inactivity expiry anchor
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  is2FAVerified: false,
  totpConfigured: false,
  username: "",
  loginAt: 0,
  lastActivity: 0,
};

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;   // 24 hours absolute
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;    // 1 hour inactivity

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "unsafe-dev-secret-must-be-at-least-32-chars",
  cookieName: "ncd-admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60, // 24h in seconds (cookie TTL)
  },
};

/**
 * Check if a session is still valid (not expired).
 */
export function isSessionValid(session: SessionData): boolean {
  if (!session.isLoggedIn) return false;

  const now = Date.now();

  // Absolute expiry: 24 hours from login
  if (now - session.loginAt > SESSION_MAX_AGE_MS) return false;

  // Inactivity expiry: 1 hour since last activity
  if (now - session.lastActivity > SESSION_IDLE_TIMEOUT_MS) return false;

  return true;
}
