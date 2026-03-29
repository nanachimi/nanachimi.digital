import { NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/lib/bookings";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * GET /api/admin/availability
 *
 * Returns the current weekly availability configuration.
 */
export async function GET() {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const slots = await getAvailability();
  return NextResponse.json({ slots });
}

/**
 * PUT /api/admin/availability
 *
 * Replaces the entire weekly availability configuration.
 * Body: { slots: AvailabilitySlot[] }
 */
export async function PUT(request: Request) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Body must contain a 'slots' array" },
        { status: 400 }
      );
    }

    // Basic validation
    for (const slot of slots) {
      if (
        typeof slot.dayOfWeek !== "number" ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6 ||
        typeof slot.startHour !== "number" ||
        typeof slot.startMinute !== "number" ||
        typeof slot.endHour !== "number" ||
        typeof slot.endMinute !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid slot format" },
          { status: 400 }
        );
      }
    }

    await setAvailability(slots);

    return NextResponse.json({ success: true, slots: await getAvailability() });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
