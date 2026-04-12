import { NextResponse } from "next/server";
import {
  verifyWebhookEvent,
  findCheckoutSessionIdForPaymentIntent,
} from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { enqueueJob } from "@/lib/job-queue";
import {
  createCommissionForPayment,
  voidCommissionForPayment,
} from "@/lib/affiliate/commission";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (payment confirmations).
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = await verifyWebhookEvent(body, signature);
    if (!event) {
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const stripeId = session.id;
        const angebotId = session.metadata?.angebotId;

        // Update payment record
        await prisma.payment.updateMany({
          where: { stripeId, status: "pending" },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        console.log(
          `[Stripe] Payment completed: session=${stripeId}, angebotId=${angebotId}`
        );

        // Enqueue Rechnung generation + payment confirmation email, and
        // create the Commission row if this submission was referred by an
        // active affiliate (commission is based on the real payment.amount).
        if (angebotId) {
          const payment = await prisma.payment.findFirst({
            where: { stripeId, status: "paid" },
          });

          if (payment) {
            await enqueueJob(
              "payment_confirmation_email",
              {
                paymentId: payment.id,
                angebotId,
                stripeId,
              },
              5,
              `payment_confirmation_${payment.id}`
            );

            try {
              const commission = await createCommissionForPayment(payment.id);
              if (commission) {
                console.log(
                  `[Affiliate] Commission created: ${commission.id} for payment ${payment.id} (${commission.amount} cents)`
                );
              }
            } catch (err) {
              console.error(
                "[Affiliate] createCommissionForPayment failed:",
                err
              );
            }
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        await prisma.payment.updateMany({
          where: { stripeId: session.id, status: "pending" },
          data: { status: "failed" },
        });
        console.log(`[Stripe] Session expired: ${session.id}`);
        break;
      }

      case "charge.refunded":
      case "charge.refund.updated": {
        // A charge was refunded — void the linked commission so the affiliate
        // is not paid on money the customer got back. Payments are stored
        // with the Checkout Session id (cs_...), so we walk back from the
        // refund's payment_intent to the session via the Stripe API.
        const charge = event.data.object as { payment_intent?: string | null };
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          try {
            const sessionId = await findCheckoutSessionIdForPaymentIntent(paymentIntentId);
            if (sessionId) {
              const payment = await prisma.payment.findFirst({
                where: { stripeId: sessionId },
              });
              if (payment) {
                await voidCommissionForPayment(
                  payment.id,
                  `Stripe event ${event.type}`,
                );
                console.log(
                  `[Affiliate] Commission voided for payment ${payment.id} (refund on ${paymentIntentId})`
                );
              }
            }
          } catch (err) {
            console.error("[Affiliate] refund handling failed:", err);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe] Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
