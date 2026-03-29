/**
 * Booking store — persisted in PostgreSQL via Prisma.
 */

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Recurring weekly availability slot defined by the founder */
export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  startHour: number; // 0-23
  startMinute: number; // 0 or 30
  endHour: number; // 0-23
  endMinute: number; // 0 or 30
}

/** A concrete booked appointment */
export interface Booking {
  id: string;
  submissionId?: string;
  createdAt: string; // ISO string
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM" (24h, Europe/Berlin)
  endTime: string; // "HH:MM"
  status: "confirmed" | "cancelled";
  // Denormalized contact info from submission
  name: string;
  email: string;
  firma?: string;
  telefon?: string;
}

/** A single available time slot returned by getAvailableSlots */
export interface TimeSlot {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

// ---------------------------------------------------------------------------
// Availability CRUD
// ---------------------------------------------------------------------------

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const rows = await prisma.availabilitySlot.findMany();
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startHour: r.startHour,
    startMinute: r.startMinute,
    endHour: r.endHour,
    endMinute: r.endMinute,
  }));
}

export async function setAvailability(slots: AvailabilitySlot[]): Promise<void> {
  // Replace all slots atomically
  await prisma.$transaction([
    prisma.availabilitySlot.deleteMany(),
    prisma.availabilitySlot.createMany({ data: slots }),
  ]);
}

// ---------------------------------------------------------------------------
// Booking CRUD
// ---------------------------------------------------------------------------

export async function addBooking(booking: Booking): Promise<void> {
  await prisma.booking.create({
    data: {
      id: booking.id,
      submissionId: booking.submissionId ?? null,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      name: booking.name,
      email: booking.email,
      firma: booking.firma ?? null,
      telefon: booking.telefon ?? null,
    },
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    submissionId: r.submissionId ?? undefined,
    createdAt: r.createdAt.toISOString(),
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    status: r.status as "confirmed" | "cancelled",
    name: r.name,
    email: r.email,
    firma: r.firma ?? undefined,
    telefon: r.telefon ?? undefined,
  }));
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const r = await prisma.booking.findUnique({ where: { id } });
  if (!r) return undefined;
  return {
    id: r.id,
    submissionId: r.submissionId ?? undefined,
    createdAt: r.createdAt.toISOString(),
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    status: r.status as "confirmed" | "cancelled",
    name: r.name,
    email: r.email,
    firma: r.firma ?? undefined,
    telefon: r.telefon ?? undefined,
  };
}

export async function getBookingsBySubmission(submissionId: string): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    where: { submissionId },
  });
  return rows.map((r) => ({
    id: r.id,
    submissionId: r.submissionId ?? undefined,
    createdAt: r.createdAt.toISOString(),
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    status: r.status as "confirmed" | "cancelled",
    name: r.name,
    email: r.email,
    firma: r.firma ?? undefined,
    telefon: r.telefon ?? undefined,
  }));
}

export async function cancelBooking(id: string): Promise<Booking | undefined> {
  try {
    const r = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return {
      id: r.id,
      submissionId: r.submissionId ?? undefined,
      createdAt: r.createdAt.toISOString(),
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status as "confirmed" | "cancelled",
      name: r.name,
      email: r.email,
      firma: r.firma ?? undefined,
      telefon: r.telefon ?? undefined,
    };
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Booking Settings
// ---------------------------------------------------------------------------

export interface BookingSettingsData {
  meetingDurationMinutes: number;
  bufferMinutes: number;
}

export async function getBookingSettings(): Promise<BookingSettingsData> {
  const row = await prisma.bookingSettings.findUnique({ where: { id: "default" } });
  return {
    meetingDurationMinutes: row?.meetingDurationMinutes ?? 30,
    bufferMinutes: row?.bufferMinutes ?? 0,
  };
}

export async function updateBookingSettings(
  settings: Partial<BookingSettingsData>
): Promise<BookingSettingsData> {
  const row = await prisma.bookingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      meetingDurationMinutes: settings.meetingDurationMinutes ?? 30,
      bufferMinutes: settings.bufferMinutes ?? 0,
    },
    update: {
      ...(settings.meetingDurationMinutes !== undefined && {
        meetingDurationMinutes: settings.meetingDurationMinutes,
      }),
      ...(settings.bufferMinutes !== undefined && {
        bufferMinutes: settings.bufferMinutes,
      }),
    },
  });
  return {
    meetingDurationMinutes: row.meetingDurationMinutes,
    bufferMinutes: row.bufferMinutes,
  };
}

// ---------------------------------------------------------------------------
// Slot computation
// ---------------------------------------------------------------------------

/** Pad a number to 2 digits */
function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Get current date/time in Europe/Berlin */
function getBerlinNow(): Date {
  const now = new Date();
  const berlinStr = now.toLocaleString("en-US", { timeZone: "Europe/Berlin" });
  return new Date(berlinStr);
}

/** Format a Date as "YYYY-MM-DD" */
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Compute available slots between `from` and `to` dates.
 * Uses configurable meeting duration from BookingSettings.
 * Filters out slots that are already booked (status = "confirmed") or in the past.
 */
export async function getAvailableSlots(from: string, to: string): Promise<TimeSlot[]> {
  const [availability, confirmedBookings, settings] = await Promise.all([
    getAvailability(),
    prisma.booking.findMany({
      where: {
        status: "confirmed",
        date: { gte: from, lte: to },
      },
      select: { date: true, startTime: true },
    }),
    getBookingSettings(),
  ]);

  const duration = settings.meetingDurationMinutes;
  const buffer = settings.bufferMinutes;
  const blockSize = duration + buffer;
  const berlinNow = getBerlinNow();

  const slots: TimeSlot[] = [];

  // Iterate each day in range
  const startDate = new Date(from + "T00:00:00");
  const endDate = new Date(to + "T23:59:59");

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = formatDate(current);

    // Find availability entries for this day
    const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      let h = slot.startHour;
      let m = slot.startMinute;

      while (true) {
        // Calculate end time of this meeting slot
        let endH = h;
        let endM = m + duration;
        while (endM >= 60) {
          endH += 1;
          endM -= 60;
        }

        // Check if the slot fits within the availability window
        if (
          endH > slot.endHour ||
          (endH === slot.endHour && endM > slot.endMinute)
        ) {
          break;
        }

        const startTime = `${pad(h)}:${pad(m)}`;
        const endTime = `${pad(endH)}:${pad(endM)}`;

        // Check if in the past
        const slotDate = new Date(current);
        slotDate.setHours(h, m, 0, 0);
        if (slotDate > berlinNow) {
          // Check if already booked
          const isBooked = confirmedBookings.some(
            (b) => b.date === dateStr && b.startTime === startTime
          );

          if (!isBooked) {
            slots.push({ date: dateStr, startTime, endTime });
          }
        }

        // Advance by blockSize (duration + buffer)
        m += blockSize;
        while (m >= 60) {
          h += 1;
          m -= 60;
        }
      }
    }

    // Next day
    current.setDate(current.getDate() + 1);
  }

  return slots;
}
