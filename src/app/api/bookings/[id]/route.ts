import { NextResponse } from "next/server";
import { cancelBooking, getBookingById } from "@/lib/bookings";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/bookings/[id]
 *
 * Public: cancel a booking (e.g. customer cancellation link).
 * Body: { status: "cancelled" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (body.status !== "cancelled") {
      return NextResponse.json(
        { error: "Only 'cancelled' status is supported" },
        { status: 400 }
      );
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    const updated = await cancelBooking(id);

    return NextResponse.json({ success: true, booking: updated });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
