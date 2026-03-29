import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/bookings";

/**
 * GET /api/bookings/available?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public endpoint — returns available 30-min slots in the given date range.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Basic date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(from, to);

  return NextResponse.json({ slots });
}
