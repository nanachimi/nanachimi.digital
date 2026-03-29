import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/incidents — List all incidents
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ incidents });
}

/**
 * PATCH /api/admin/incidents — Update incident status
 * Body: { id, status: "acknowledged" | "resolved" }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await request.json();

  if (!id || !["acknowledged", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      status,
      ...(status === "resolved" ? { resolvedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ incident });
}
