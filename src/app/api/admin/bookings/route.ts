import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllBookings,
  getAvailability,
  setAvailability,
  getBookingSettings,
  updateBookingSettings,
} from "@/lib/bookings";

export const dynamic = "force-dynamic";

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
});

const bookingsPutSchema = z.object({
  availability: z.array(availabilitySlotSchema).optional(),
  settings: z.object({
    meetingDurationMinutes: z.number().int().min(5).max(480).optional(),
    bufferMinutes: z.number().int().min(0).max(120).optional(),
  }).optional(),
});

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
    const parsed = bookingsPutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Anfrage" },
        { status: 400 }
      );
    }

    if (parsed.data.availability) {
      await setAvailability(parsed.data.availability);
    }

    if (parsed.data.settings) {
      const { meetingDurationMinutes, bufferMinutes } = parsed.data.settings;
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
