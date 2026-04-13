/**
 * Affiliate attribution — cookie handling and winner selection.
 *
 * Attribution rule (validated with founder):
 * 1. If the customer uses a VALID promo code whose PromoCode is tied to an
 *    affiliate → that affiliate is the **winner**, no matter what cookie says.
 * 2. Otherwise, if the customer has a valid `ncd_ref` cookie pointing to an
 *    active affiliate → that affiliate is the winner.
 * 3. Otherwise, no affiliate attribution.
 *
 * In all cases, the first-touch cookie handle is logged onto
 * `Submission.firstTouchAffiliateId` for analytics (even if the promo code
 * overrides it).
 */

import { prisma } from "@/lib/db";
import type { Affiliate } from "@prisma/client";

// ─── Cookie constants ─────────────────────────────────────────────────

/** Cookie name that stores the referring affiliate's handle. */
export const REF_COOKIE_NAME = "ncd_ref";

/** Cookie lifetime: 2 years, matching the commission window. */
export const REF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 63072000

/** Handle pattern (also used by middleware to detect /@handle URLs). */
export const HANDLE_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

/** Reserved handles that may NOT be assigned to affiliates (route collisions). */
export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "app",
  "affiliates",
  "backoffice",
  "onboarding",
  "angebot",
  "kontakt",
  "portfolio",
  "leistungen",
  "ueber-mich",
  "impressum",
  "datenschutz",
  "agb",
  "partner-agb",
  "robots",
  "sitemap",
  "www",
  "mail",
  "dev",
  "staging",
  "prod",
  "test",
  "null",
  "undefined",
]);

/**
 * Check whether a handle is syntactically valid AND not reserved.
 * Used at affiliate creation time — NOT at cookie read time (we accept any
 * cookie value but the DB lookup will fail for invalid handles anyway).
 */
export function isValidHandle(handle: string): boolean {
  if (!HANDLE_PATTERN.test(handle)) return false;
  if (RESERVED_HANDLES.has(handle.toLowerCase())) return false;
  return true;
}

// ─── Winner selection ────────────────────────────────────────────────

export interface AttributionInput {
  /** Handle read from the `ncd_ref` cookie (may be null). */
  cookieHandle: string | null;
  /** PromoCode record resolved from a valid promo code (may be null). */
  promoCode: { id: string; affiliateId: string | null } | null;
}

export interface AttributionResult {
  /** The affiliate id that will be credited (winner). */
  winnerAffiliateId: string | null;
  /** The affiliate id the customer first touched (for analytics). */
  firstTouchAffiliateId: string | null;
  /** Why this winner was chosen (debug / audit). */
  source: "promo_code" | "cookie" | "none";
}

/**
 * Resolve the final attribution for a submission.
 *
 * Performs up to two DB lookups (one per handle / promo affiliate) — keep
 * this out of middleware/edge runtime, call from server routes only.
 */
export async function resolveAttribution(
  input: AttributionInput,
): Promise<AttributionResult> {
  // 1. Resolve the first-touch affiliate from the cookie handle (analytics).
  const firstTouchAffiliate = input.cookieHandle
    ? await findActiveAffiliateByHandle(input.cookieHandle)
    : null;

  // 2. Winner selection — promo code wins if present and attached to an
  //    active affiliate.
  if (input.promoCode?.affiliateId) {
    const promoAffiliate = await prisma.affiliate.findUnique({
      where: { id: input.promoCode.affiliateId },
    });
    if (promoAffiliate && promoAffiliate.status === "active") {
      return {
        winnerAffiliateId: promoAffiliate.id,
        firstTouchAffiliateId: firstTouchAffiliate?.id ?? null,
        source: "promo_code",
      };
    }
  }

  // 3. Fall back to cookie attribution.
  if (firstTouchAffiliate) {
    return {
      winnerAffiliateId: firstTouchAffiliate.id,
      firstTouchAffiliateId: firstTouchAffiliate.id,
      source: "cookie",
    };
  }

  return {
    winnerAffiliateId: null,
    firstTouchAffiliateId: null,
    source: "none",
  };
}

/**
 * Find an active affiliate by handle (case-insensitive is NOT applied —
 * handles are stored as-is and compared strictly).
 */
export async function findActiveAffiliateByHandle(
  handle: string,
): Promise<Affiliate | null> {
  if (!HANDLE_PATTERN.test(handle)) return null;
  const affiliate = await prisma.affiliate.findUnique({
    where: { handle },
  });
  if (!affiliate || affiliate.status !== "active") return null;
  return affiliate;
}

// ─── Referral record ─────────────────────────────────────────────────

/**
 * Create or reuse a Referral row for a (visitorId, affiliateId) pair.
 * Called from the onboarding API when a submission is created with
 * attribution. Idempotent per pair.
 */
export async function upsertReferral(params: {
  visitorId: string;
  affiliateId: string;
  source: "handle_link" | "promo_code";
  submissionId?: string;
}): Promise<void> {
  const existing = await prisma.referral.findFirst({
    where: {
      visitorId: params.visitorId,
      affiliateId: params.affiliateId,
    },
    orderBy: { firstTouchAt: "asc" },
  });

  if (!existing) {
    const now = new Date();
    const cookieExpiresAt = new Date(
      now.getTime() + REF_COOKIE_MAX_AGE_SECONDS * 1000,
    );
    await prisma.referral.create({
      data: {
        visitorId: params.visitorId,
        affiliateId: params.affiliateId,
        source: params.source,
        firstTouchAt: now,
        cookieExpiresAt,
        submissionId: params.submissionId ?? null,
        convertedAt: params.submissionId ? now : null,
      },
    });
    return;
  }

  // If we already have a referral but it wasn't converted, update it.
  if (params.submissionId && !existing.submissionId) {
    await prisma.referral.update({
      where: { id: existing.id },
      data: {
        submissionId: params.submissionId,
        convertedAt: new Date(),
      },
    });
  }
}
