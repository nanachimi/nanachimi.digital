import { NextResponse } from "next/server";
import { verifyWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/db";

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

        // Update payment record
        await prisma.payment.updateMany({
          where: { stripeId, status: "pending" },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        console.log(
          `[Stripe] Payment completed: session=${stripeId}, angebotId=${session.metadata?.angebotId}`
        );
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
