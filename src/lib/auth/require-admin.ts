/**
 * Server-side guard for admin API routes.
 * Belt-and-suspenders: middleware handles auth too, but this is defense-in-depth.
 */

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  SessionData,
  sessionOptions,
  isSessionValid,
} from "./session";

/**
 * Verify the current request has a valid, fully-authenticated admin session.
 * Updates lastActivity on success.
 * Throws on failure — caller should catch and return 401.
 */
export async function requireAdmin(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn || !session.is2FAVerified) {
    throw new Error("UNAUTHORIZED");
  }

  if (!isSessionValid(session)) {
    session.destroy();
    throw new Error("SESSION_EXPIRED");
  }

  // Update activity timestamp (sliding window).
  // session.save() fails in RSC render (cookies are read-only there), so we
  // swallow the error — Route Handlers still get the sliding update, and
  // session validity is also checked by the middleware on every request.
  session.lastActivity = Date.now();
  try {
    await session.save();
  } catch {
    /* RSC context — cookies cannot be modified during render */
  }

  return session;
}
