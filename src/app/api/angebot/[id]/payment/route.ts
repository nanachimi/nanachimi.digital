import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { calculatePaymentOptions, BETRIEB_UND_WARTUNG, type PaymentType } from "@/lib/constants";
import { getPromoDiscountForSubmission } from "@/lib/promo";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/angebot/[id]/payment
 * Returns the payment status for this Angebot.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { angebotId: id, status: "paid" },
    orderBy: { paidAt: "desc" },
  });

  if (payment) {
    return NextResponse.json({
      paid: true,
      amount: payment.amount / 100, // cents → euros
      type: payment.type,
      method: payment.method,
      paidAt: payment.paidAt?.toISOString(),
    });
  }

  // Check for pending payment
  const pending = await prisma.payment.findFirst({
    where: { angebotId: id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    paid: false,
    pendingPayment: pending ? { type: pending.type, method: pending.method } : null,
  });
}

/**
 * POST /api/angebot/[id]/payment
 * Creates a Stripe Checkout Session for the selected payment option.
 * Body: { type: "full" | "half" | "tranche_1" }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online-Zahlung ist derzeit nicht verfügbar. Bitte nutzen Sie die Banküberweisung." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const paymentType = body.type as PaymentType;

  if (!paymentType || !["full", "half", "tranche_1"].includes(paymentType)) {
    return NextResponse.json(
      { error: "Ungültiger Zahlungstyp" },
      { status: 400 }
    );
  }

  const angebot = await getAngebotById(id);
  if (!angebot) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  if (angebot.status !== "accepted") {
    return NextResponse.json(
      { error: "Angebot muss zuerst angenommen werden" },
      { status: 400 }
    );
  }

  const submission = await getSubmissionById(angebot.submissionId);

  // Calculate amounts (additive stacking: promo discount + payment-time discount).
  const promoDiscount = await getPromoDiscountForSubmission(angebot.submissionId);
  const options = calculatePaymentOptions(angebot.festpreis, promoDiscount);
  const option = options.find((o) => o.type === paymentType);
  if (!option) {
    return NextResponse.json({ error: "Zahlungsoption nicht gefunden" }, { status: 400 });
  }

  // Calculate betreuung cost (separate position, no discounts apply)
  const betreuungMonate = angebot.betreuungMonate ?? null;
  let betreuungCost = 0;
  if (betreuungMonate) {
    const pkg = BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === betreuungMonate);
    if (pkg) betreuungCost = pkg.preisProMonat * betreuungMonate;
  }

  try {
    const result = await createCheckoutSession({
      angebotId: id,
      festpreis: angebot.festpreis,
      paymentType,
      promoDiscount,
      betreuungMonate: betreuungMonate ?? undefined,
      betreuungCost: betreuungCost || undefined,
      customerEmail: submission?.email,
      customerName: submission?.name,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Stripe-Session konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // Create Payment record — split discount into promo + payment-time parts
    // so the affiliate system can compute commissions on the real amount paid
    // and the admin dashboard can show the breakdown.
    // Amount includes betreuung cost (project amount + betreuung).
    await prisma.payment.create({
      data: {
        angebotId: id,
        amount: (option.amount + betreuungCost) * 100, // Store in cents
        discount: option.paymentDiscountAmount * 100, // payment-time discount only
        promoDiscount: option.promoDiscountAmount * 100,
        type: paymentType,
        method: "stripe",
        stripeId: result.sessionId,
        status: "pending",
      },
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Payment] Stripe checkout error:", message, err);
    return NextResponse.json(
      { error: `Zahlung fehlgeschlagen: ${message}` },
      { status: 500 }
    );
  }
}
