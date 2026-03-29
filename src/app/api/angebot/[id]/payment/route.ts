import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { calculatePaymentOptions, type PaymentType } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
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

  // Calculate amounts
  const options = calculatePaymentOptions(angebot.festpreis);
  const option = options.find((o) => o.type === paymentType);
  if (!option) {
    return NextResponse.json({ error: "Zahlungsoption nicht gefunden" }, { status: 400 });
  }

  try {
    const result = await createCheckoutSession({
      angebotId: id,
      festpreis: angebot.festpreis,
      paymentType,
      customerEmail: submission?.email,
      customerName: submission?.name,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Stripe-Session konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // Create Payment record
    await prisma.payment.create({
      data: {
        angebotId: id,
        amount: option.amount * 100, // Store in cents
        discount: option.discount * 100,
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
