import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllBookings,
  getAvailability,
  setAvailability,
  getBookingSettings,
  updateBookingSettings,
} from "@/lib/bookings";
import type { AvailabilitySlot } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** GET /api/admin/bookings — list all bookings + availability + settings */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const [bookings, availability, settings] = await Promise.all([
    getAllBookings(),
    getAvailability(),
    getBookingSettings(),
  ]);

  return NextResponse.json({ bookings, availability, settings });
}

/** PUT /api/admin/bookings — update availability slots + settings */
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Update availability if provided
    if (body.availability) {
      if (!Array.isArray(body.availability)) {
        return NextResponse.json(
          { error: "availability muss ein Array sein" },
          { status: 400 }
        );
      }

      for (const slot of body.availability as AvailabilitySlot[]) {
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

      await setAvailability(body.availability);
    }

    // Update settings if provided
    if (body.settings) {
      const { meetingDurationMinutes, bufferMinutes } = body.settings;
      await updateBookingSettings({
        ...(meetingDurationMinutes !== undefined && { meetingDurationMinutes }),
        ...(bufferMinutes !== undefined && { bufferMinutes }),
      });
    }

    const [availability, settings] = await Promise.all([
      getAvailability(),
      getBookingSettings(),
    ]);

    return NextResponse.json({ availability, settings });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }
}
