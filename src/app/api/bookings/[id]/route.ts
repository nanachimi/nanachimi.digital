import { NextResponse } from "next/server";
import { cancelBooking, getBookingById } from "@/lib/bookings";

/**
 * PATCH /api/bookings/[id]
 *
 * Admin: cancel a booking.
 * Body: { status: "cancelled" }
 * TODO: Add authentication check.
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
