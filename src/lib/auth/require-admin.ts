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

  // Update activity timestamp (sliding window)
  session.lastActivity = Date.now();
  await session.save();

  return session;
}
