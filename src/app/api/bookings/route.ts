import { NextResponse } from "next/server";
import {
  addBooking,
  getAvailableSlots,
  type Booking,
} from "@/lib/bookings";
import { getSubmissionById } from "@/lib/submissions";
import { formLimiter } from "@/lib/auth/rate-limit";
export const dynamic = "force-dynamic";

/**
 * POST /api/bookings
 *
 * Public: Create a new booking.
 * Either provide { submissionId, date, startTime } (from onboarding)
 * or { name, email, date, startTime } (from kontakt page).
 */
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!formLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { submissionId, date, startTime, name, email, firma, telefon } = body;

    if (!date || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields: date, startTime" },
        { status: 400 }
      );
    }

    // Validate date format and bounds
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Ungültiges Datumsformat" }, { status: 400 });
    }
    const bookingDate = new Date(date + "T00:00:00");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 90);
    if (bookingDate < today || bookingDate > maxDate) {
      return NextResponse.json({ error: "Termin muss innerhalb der nächsten 90 Tage liegen" }, { status: 400 });
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: "Ungültiges Zeitformat" }, { status: 400 });
    }

    let contactName: string;
    let contactEmail: string;
    let contactFirma: string | undefined;
    let contactTelefon: string | undefined;

    if (submissionId) {
      // Booking linked to an onboarding submission
      const submission = await getSubmissionById(submissionId);
      if (!submission) {
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }
      contactName = submission.name;
      contactEmail = submission.email;
      contactFirma = submission.firma;
      contactTelefon = submission.telefon;
    } else if (name && email) {
      // Direct booking from kontakt page
      contactName = name;
      contactEmail = email;
      contactFirma = firma;
      contactTelefon = telefon;
    } else {
      return NextResponse.json(
        { error: "Missing required fields: either submissionId or name+email" },
        { status: 400 }
      );
    }

    // Verify slot is still available (race-condition guard)
    const available = await getAvailableSlots(date, date);
    const slotExists = available.some(
      (s) => s.date === date && s.startTime === startTime
    );

    if (!slotExists) {
      return NextResponse.json(
        { error: "Dieser Termin ist leider nicht mehr verfügbar." },
        { status: 409 }
      );
    }

    // Calculate endTime (+30 min)
    const [h, m] = startTime.split(":").map(Number);
    let endH = h;
    let endM = m + 30;
    if (endM >= 60) {
      endH += 1;
      endM -= 60;
    }
    const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    // Create booking
    const randomStr = Math.random().toString(36).substring(2, 8);
    const booking: Booking = {
      id: `bk_${Date.now()}_${randomStr}`,
      submissionId,
      createdAt: new Date().toISOString(),
      date,
      startTime,
      endTime,
      status: "confirmed",
      name: contactName,
      email: contactEmail,
      firma: contactFirma,
      telefon: contactTelefon,
    };

    await addBooking(booking);

    // Persist booking link on submission
    if (submissionId) {
      const { prisma } = await import("@/lib/db");
      await prisma.submission.update({
        where: { id: submissionId },
        data: { bookingId: booking.id },
      }).catch(() => {/* submission might not exist */});
    }

    return NextResponse.json({ success: true, booking });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

