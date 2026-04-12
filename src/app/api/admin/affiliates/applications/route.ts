/**
 * Admin API — affiliate applications queue.
 * GET /api/admin/affiliates/applications
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const applications = await prisma.affiliateApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
