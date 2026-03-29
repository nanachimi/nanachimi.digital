import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAllBookings, getAvailability, setAvailability } from "@/lib/bookings";
import type { AvailabilitySlot } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** GET /api/admin/bookings — list all bookings + availability */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const [bookings, availability] = await Promise.all([
    getAllBookings(),
    getAvailability(),
  ]);

  return NextResponse.json({ bookings, availability });
}

/** PUT /api/admin/bookings — update availability slots */
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { availability } = await request.json();

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: "availability muss ein Array sein" },
        { status: 400 }
      );
    }

    // Validate each slot
    for (const slot of availability as AvailabilitySlot[]) {
      if (
        typeof slot.dayOfWeek !== "number" ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6 ||
        typeof slot.startHour !== "number" ||
        typeof slot.endHour !== "number"
      ) {
        return NextResponse.json(
          { error: "Ungültiger Zeitslot" },
          { status: 400 }
        );
      }
    }

    await setAvailability(availability);
    const updated = await getAvailability();
    return NextResponse.json({ availability: updated });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }
}
