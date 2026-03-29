import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { cancelBooking, getBookingById } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** GET /api/admin/bookings/:id */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(booking);
}

/** PATCH /api/admin/bookings/:id — cancel a booking */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.status === "cancelled") {
    const updated = await cancelBooking(id);
    if (!updated) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Nur status: cancelled erlaubt" }, { status: 400 });
}
