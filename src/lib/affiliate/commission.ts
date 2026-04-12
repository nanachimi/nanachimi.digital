/**
 * Commission calculation and creation.
 *
 * Core principles:
 * - Commission is ALWAYS calculated on `Payment.amount` (the real amount
 *   actually charged by Stripe, AFTER all discounts: promo code +
 *   payment-time discount). The affiliate is never paid on a festpreis the
 *   customer did not actually pay.
 * - Multi-tranche payments: each Payment row generates its own Commission.
 *   The total commission for a client = sum of commissions across tranches.
 * - 2-year window: each tranche checks against the original referral date.
 *   A payment that arrives 23 months after first-touch earns; 25 months does not.
 * - Rate snapshot: the affiliate's commissionRate at the moment of creation
 *   is frozen onto the Commission row. Future rate changes do not affect
 *   historical commissions.
 * - Refunds: a Commission whose Payment is refunded becomes `void`. If it
 *   was already paid out, a negative correction must be issued manually.
 */

import { prisma } from "@/lib/db";
import type { Commission } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────

/** Commissions are eligible for 2 years after the first referral touch. */
export const REFERRAL_WINDOW_YEARS = 2;

/** Pending commissions become `approved` after this refund hold window. */
export const COMMISSION_HOLD_DAYS = 14;

// ─── Pure helpers ─────────────────────────────────────────────────────

/**
 * Calculate the commission amount for a given payment.
 *
 * Uses Math.floor so we never over-pay (rounds in the company's favor at
 * the cent level — over many transactions this is negligible per affiliate
 * but ensures we never pay more than `paymentAmount × rate`).
 *
 * @param paymentAmountCents  The net amount actually paid by the customer.
 * @param rate                The affiliate's commission rate (e.g., 0.10 for 10%).
 */
export function calculateCommissionAmount(
  paymentAmountCents: number,
  rate: number,
): number {
  if (paymentAmountCents <= 0 || rate <= 0) return 0;
  return Math.floor(paymentAmountCents * rate);
}

/**
 * Check whether a payment falls inside the 2-year referral window.
 *
 * The window starts at `firstTouchAt` (when the visitor first clicked the
 * affiliate's link or used the promo code) and lasts REFERRAL_WINDOW_YEARS.
 */
export function isWithinReferralWindow(
  firstTouchAt: Date,
  paymentPaidAt: Date,
): boolean {
  const limit = addYears(firstTouchAt, REFERRAL_WINDOW_YEARS);
  return paymentPaidAt <= limit;
}

/**
 * Compute the commission expiration date (= first touch + 2 years).
 * Used when creating a Commission row.
 */
export function computeCommissionExpiresAt(firstTouchAt: Date): Date {
  return addYears(firstTouchAt, REFERRAL_WINDOW_YEARS);
}

/**
 * Compute the earliest date at which a pending commission can be approved.
 * Used by the daily cron that transitions `pending → approved`.
 */
export function computeApprovalEligibleAt(earnedAt: Date): Date {
  return addDays(earnedAt, COMMISSION_HOLD_DAYS);
}

// ─── DB mutations ─────────────────────────────────────────────────────

/**
 * Create a Commission row for a paid Payment, if the submission is attributed
 * to an active affiliate AND the payment falls inside the 2-year window.
 *
 * Idempotent: if a Commission already exists for this payment, it is returned
 * unchanged. If the submission has no affiliate, or the affiliate is not
 * active, or the payment is outside the window, returns null.
 */
export async function createCommissionForPayment(
  paymentId: string,
): Promise<Commission | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      commission: true,
      angebot: {
        include: {
          submission: true,
        },
      },
    },
  });

  if (!payment) return null;
  if (payment.commission) return payment.commission;
  if (payment.status !== "paid" || !payment.paidAt) return null;

  const submission = payment.angebot.submission;
  if (!submission.affiliateId) return null;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: submission.affiliateId },
  });
  if (!affiliate || affiliate.status !== "active") return null;

  // Find the earliest Referral for this (visitor, affiliate) pair to anchor
  // the 2-year window. Fallback: the submission creation date.
  const referral = await prisma.referral.findFirst({
    where: {
      affiliateId: affiliate.id,
      OR: [
        { submissionId: submission.id },
        submission.visitorId ? { visitorId: submission.visitorId } : { id: "__never__" },
      ],
    },
    orderBy: { firstTouchAt: "asc" },
  });

  const firstTouchAt = referral?.firstTouchAt ?? submission.createdAt;

  if (!isWithinReferralWindow(firstTouchAt, payment.paidAt)) {
    return null;
  }

  const rate = Number(affiliate.commissionRate);
  const amount = calculateCommissionAmount(payment.amount, rate);
  if (amount <= 0) return null;

  return prisma.commission.create({
    data: {
      affiliateId: affiliate.id,
      paymentId: payment.id,
      amount,
      rateSnapshot: affiliate.commissionRate,
      status: "pending",
      earnedAt: payment.paidAt,
      commissionExpiresAt: computeCommissionExpiresAt(firstTouchAt),
    },
  });
}

/**
 * Void a commission when its underlying payment is refunded.
 * Safe to call multiple times — idempotent on status.
 */
export async function voidCommissionForPayment(
  paymentId: string,
  reason?: string,
): Promise<Commission | null> {
  const commission = await prisma.commission.findUnique({
    where: { paymentId },
  });
  if (!commission) return null;
  if (commission.status === "void") return commission;
  if (commission.status === "paid") {
    // Already paid out — needs manual clawback. Log via Incident instead.
    await prisma.incident.create({
      data: {
        severity: "warning",
        title: "Commission clawback required",
        message: `Payment ${paymentId} refunded after commission ${commission.id} was already paid. Manual clawback needed. ${reason ?? ""}`.trim(),
        source: "payment",
        referenceId: commission.id,
      },
    });
    return commission;
  }
  return prisma.commission.update({
    where: { id: commission.id },
    data: { status: "void" },
  });
}

// ─── Internals ────────────────────────────────────────────────────────

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
