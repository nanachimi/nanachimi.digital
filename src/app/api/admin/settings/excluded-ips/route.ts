import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/settings/excluded-ips
 * Returns all excluded IPs.
 */
export async function GET() {
  try {
    const ips = await prisma.excludedIp.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ips);
  } catch (err) {
    console.error("[ExcludedIPs] GET error:", err);
    return NextResponse.json(
      { error: "Laden fehlgeschlagen" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/excluded-ips
 * Add a new excluded IP.
 * Body: { ip: string, label?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip = (body.ip as string)?.trim();
    const label = (body.label as string)?.trim() || null;

    if (!ip) {
      return NextResponse.json(
        { error: "IP-Adresse erforderlich" },
        { status: 400 }
      );
    }

    // Basic IP validation (IPv4 or IPv6)
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^[0-9a-fA-F:]+$/;
    if (!ipv4.test(ip) && !ipv6.test(ip)) {
      return NextResponse.json(
        { error: "Ungültige IP-Adresse" },
        { status: 400 }
      );
    }

    const record = await prisma.excludedIp.upsert({
      where: { ip },
      update: { label },
      create: { ip, label },
    });

    // Invalidate the cached set
    invalidateExcludedIpCache();

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[ExcludedIPs] POST error:", err);
    return NextResponse.json(
      { error: "Speichern fehlgeschlagen" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/excluded-ips?id=xxx
 * Remove an excluded IP by ID.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID erforderlich" },
        { status: 400 }
      );
    }

    await prisma.excludedIp.delete({ where: { id } });

    // Invalidate the cached set
    invalidateExcludedIpCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ExcludedIPs] DELETE error:", err);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}

// ─── Cache helper (shared with analytics tracking) ──────────────

// Re-export invalidation for use by the route above
function invalidateExcludedIpCache() {
  // Import dynamically to avoid circular deps
  import("@/lib/excluded-ips").then((mod) => mod.invalidateCache());
}
