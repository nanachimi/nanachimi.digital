import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailability, setAvailability } from "@/lib/bookings";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";

const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
});

const putSchema = z.object({
  slots: z.array(slotSchema),
});

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
    const parsed = putSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültiges Slot-Format" },
        { status: 400 }
      );
    }

    await setAvailability(parsed.data.slots);

    return NextResponse.json({ success: true, slots: await getAvailability() });
  } catch {
    return NextResponse.json(
      { error: "Ungültige Anfrage" },
      { status: 400 }
    );
  }
}
