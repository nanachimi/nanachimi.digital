import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notifications
 * Returns per-section badge counts for the admin sidebar.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const [
    openIncidents,
    failedJobs,
    pendingSubmissions,
    customerReplies,
    upcomingBookings,
    systemIncidents,
  ] = await Promise.all([
    // Open/acknowledged incidents (Vorfälle)
    prisma.incident.count({
      where: { status: { in: ["open", "acknowledged"] } },
    }),
    // Failed jobs (Vorfälle)
    prisma.job.count({
      where: { status: "failed" },
    }),
    // New Anfragen awaiting review (Dashboard)
    prisma.submission.count({
      where: { status: { in: ["pending", "sla_active", "sla_breached"] } },
    }),
    // Customer replies: accepted or rejected (Dashboard)
    prisma.submission.count({
      where: { status: { in: ["accepted", "rejected_by_client"] } },
    }),
    // Upcoming confirmed bookings from today onwards (Termine)
    prisma.booking.count({
      where: { status: "confirmed", date: { gte: today } },
    }),
    // System-related open incidents (Systemstatus)
    prisma.incident.count({
      where: {
        status: { in: ["open", "acknowledged"] },
        source: "system",
      },
    }),
  ]);

  // Per-section counts for sidebar badges
  const dashboard = pendingSubmissions + customerReplies;
  const bookings = upcomingBookings;
  const incidents = openIncidents + failedJobs;
  const status = systemIncidents;

  return NextResponse.json({
    dashboard,
    bookings,
    incidents,
    status,
  });
}
