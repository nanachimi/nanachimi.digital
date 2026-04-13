/**
 * Promo code utilities — composition, temporal uniqueness, and consumption validation.
 *
 * Code formats (all stored and compared lowercase, case-insensitive):
 *   Admin code  = campaignCode              → e.g. "startup2026"
 *   Affiliate   = handle + discountPercent%  → e.g. "sysys3525" (handle "sysys35", 25%)
 */

import { prisma } from "@/lib/db";

// ─── Constants ────────────────────────────────────────────────────────

/** Max total discount (promo + payment-time) clamped at 50 %. */
export const MAX_TOTAL_DISCOUNT = 0.5;

// ─── Composition ──────────────────────────────────────────────────────

/**
 * Admin promo code = campaignCode lowercased.
 * e.g. "Startup2026" → "startup2026"
 */
export function composeAdminCode(campaignCode: string): string {
  return campaignCode.toLowerCase();
}

/**
 * Affiliate promo code = handle + discount percentage integer, lowercased.
 * e.g. ("sysys35", 0.25) → "sysys3525"
 */
export function composeAffiliateCode(
  handle: string,
  discountPercent: number,
): string {
  const percentInt = Math.round(discountPercent * 100);
  return `${handle}${percentInt}`.toLowerCase();
}

// ─── Temporal uniqueness ──────────────────────────────────────────────

/**
 * Check if a promo code string is available — no active code with an
 * overlapping campaign validity period exists.
 *
 * Two campaigns overlap when:
 *   existingFrom < newUntil AND newFrom < existingUntil
 *   (with null validUntil treated as "forever")
 */
export async function isCodeAvailable(
  code: string,
  validFrom: Date,
  validUntil: Date | null,
  excludeId?: string,
): Promise<boolean> {
  const normalized = code.toLowerCase();

  // Find active promo codes with the same normalized code whose campaign
  // validity overlaps with [validFrom, validUntil].
  const conflicts = await prisma.promoCode.findMany({
    where: {
      code: normalized,
      active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      campaign: {
        // Overlap condition: existing.validFrom < new.validUntil
        //                AND new.validFrom < existing.validUntil
        AND: [
          // existing.validFrom < newUntil  (if newUntil is null = forever, always true)
          ...(validUntil
            ? [{ validFrom: { lt: validUntil } }]
            : []),
          // newFrom < existing.validUntil  (if existing.validUntil is null = forever, always true)
          {
            OR: [
              { validUntil: null },
              { validUntil: { gt: validFrom } },
            ],
          },
        ],
      },
    },
    select: { id: true },
    take: 1,
  });

  return conflicts.length === 0;
}

// ─── Consumption validation ───────────────────────────────────────────

export type PromoValidationError =
  | "not_found"
  | "inactive"
  | "expired"
  | "not_yet_valid"
  | "max_uses"
  | "campaign_inactive"
  | "campaign_expired";

export type PromoValidationResult =
  | {
      valid: true;
      id: string;
      code: string;
      discountPercent: number;
      affiliateId: string | null;
      campaignId: string;
    }
  | { valid: false; reason: PromoValidationError };

/**
 * Validate a promo code at the moment a customer tries to use it.
 *
 * - Case-insensitive lookup (all codes stored lowercase).
 * - Verifies both the PromoCode and its parent Campaign are currently valid.
 * - Does NOT increment usedCount — that happens only when the code is actually
 *   consumed (i.e. attached to a Submission).
 */
export async function validatePromoCode(
  code: string,
): Promise<PromoValidationResult> {
  if (!code || code.trim().length < 3) {
    return { valid: false, reason: "not_found" };
  }

  const normalized = code.trim().toLowerCase();

  const promo = await prisma.promoCode.findFirst({
    where: { code: normalized },
    include: { campaign: true },
  });

  if (!promo) return { valid: false, reason: "not_found" };
  if (!promo.active) return { valid: false, reason: "inactive" };

  const now = new Date();
  const { campaign } = promo;

  if (!campaign.active) return { valid: false, reason: "campaign_inactive" };
  if (campaign.validFrom > now) return { valid: false, reason: "not_yet_valid" };
  if (campaign.validUntil && campaign.validUntil < now) {
    return { valid: false, reason: "campaign_expired" };
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: "max_uses" };
  }

  return {
    valid: true,
    id: promo.id,
    code: promo.code,
    discountPercent: Number(promo.discountPercent),
    affiliateId: promo.affiliateId,
    campaignId: promo.campaignId,
  };
}

// ─── Discount stacking ────────────────────────────────────────────────

/**
 * Additive stacking: the total discount is the sum of promo + payment-time,
 * clamped at MAX_TOTAL_DISCOUNT to protect margins.
 *
 * Returns both the clamped total and the individual parts (for display).
 */
export function stackDiscounts(
  promoDiscount: number,
  paymentDiscount: number,
): {
  total: number;
  promo: number;
  payment: number;
  clamped: boolean;
} {
  const rawTotal = promoDiscount + paymentDiscount;
  const clamped = rawTotal > MAX_TOTAL_DISCOUNT;
  const total = clamped ? MAX_TOTAL_DISCOUNT : rawTotal;
  return {
    total,
    promo: promoDiscount,
    payment: paymentDiscount,
    clamped,
  };
}

/**
 * Look up the promo discount percentage that should be applied to a
 * submission's Angebot, if any.
 *
 * Returns 0 when:
 * - the submission has no promo code attached
 * - the PromoCode row has been deactivated since consumption
 * - the PromoCode / Campaign can no longer be resolved
 *
 * We read `discountPercent` off the PromoCode row (snapshot of the campaign
 * value at code creation) rather than the Campaign itself, so rate changes
 * on the Campaign after the fact never alter a price the customer already
 * saw in their Angebot.
 */
export async function getPromoDiscountForSubmission(
  submissionId: string,
): Promise<number> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { promoCodeId: true },
  });
  if (!submission?.promoCodeId) return 0;
  const promo = await prisma.promoCode.findUnique({
    where: { id: submission.promoCodeId },
    select: { discountPercent: true, active: true },
  });
  if (!promo || !promo.active) return 0;
  return Number(promo.discountPercent);
}

/**
 * Apply stacked discounts to a festpreis (in euros).
 */
export function applyDiscounts(
  festpreisEur: number,
  promoDiscount: number,
  paymentDiscount: number,
): {
  finalPriceEur: number;
  totalDiscountPct: number;
  savingsEur: number;
} {
  const stack = stackDiscounts(promoDiscount, paymentDiscount);
  const finalPriceEur = Math.round(festpreisEur * (1 - stack.total));
  return {
    finalPriceEur,
    totalDiscountPct: stack.total,
    savingsEur: festpreisEur - finalPriceEur,
  };
}
