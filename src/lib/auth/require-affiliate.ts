/**
 * Server-side guard for affiliate API routes and pages.
 * Same pattern as require-admin.ts.
 */

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  AffiliateSessionData,
  affiliateSessionOptions,
  isAffiliateSessionValid,
} from "./affiliate-session";

/**
 * Verify the current request has a valid, fully-authenticated affiliate session.
 * Updates lastActivity on success.
 * Throws on failure — caller should catch and return 401 / redirect.
 */
export async function requireAffiliate(): Promise<AffiliateSessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<AffiliateSessionData>(cookieStore, affiliateSessionOptions);

  if (!session.isLoggedIn) {
    throw new Error("UNAUTHORIZED");
  }

  if (!isAffiliateSessionValid(session)) {
    session.destroy();
    throw new Error("SESSION_EXPIRED");
  }

  // Update activity timestamp (sliding window).
  // session.save() fails in RSC render (cookies are read-only there), so we
  // swallow the error — Route Handlers still get the sliding update.
  session.lastActivity = Date.now();
  try {
    await session.save();
  } catch {
    /* RSC context — cookies cannot be modified during render */
  }

  return session;
}
