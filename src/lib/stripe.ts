import Stripe from "stripe";
import type { PaymentType } from "@/lib/constants";
import { PAYMENT_DISCOUNTS, calculatePaymentOptions } from "@/lib/constants";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY);
}

export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY;
}

/**
 * Create a Stripe Checkout Session for an Angebot payment.
 * Returns the checkout URL or null if Stripe is not configured.
 */
export async function createCheckoutSession(opts: {
  angebotId: string;
  festpreis: number;
  paymentType: PaymentType;
  customerEmail?: string;
  customerName?: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const options = calculatePaymentOptions(opts.festpreis);
  const option = options.find((o) => o.type === opts.paymentType);
  if (!option) throw new Error(`Invalid payment type: ${opts.paymentType}`);

  const config = PAYMENT_DISCOUNTS[opts.paymentType];
  const description = option.discountPercent > 0
    ? `${config.label} — ${option.discountPercent}% Rabatt (${formatEuro(option.festpreisDiscounted)} statt ${formatEuro(opts.festpreis)})`
    : `${config.label} — Vor Projektstart`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: option.amount * 100, // Stripe uses cents
          product_data: {
            name: `NanaChimi Digital — Projektzahlung`,
            description,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      angebotId: opts.angebotId,
      paymentType: opts.paymentType,
      festpreis: String(opts.festpreis),
      discountPercent: String(option.discountPercent),
    },
    customer_email: opts.customerEmail,
    success_url: `${siteUrl}/angebot/${opts.angebotId}?payment=success`,
    cancel_url: `${siteUrl}/angebot/${opts.angebotId}?payment=cancelled`,
    locale: "de",
  });

  if (!session.url) throw new Error("Stripe session URL not available");

  return { url: session.url, sessionId: session.id };
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Verify and parse a Stripe webhook event.
 */
export async function verifyWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event | null> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return null;

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
