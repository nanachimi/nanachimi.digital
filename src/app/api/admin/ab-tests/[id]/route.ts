import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getTestById,
  updateTest,
  deleteTest,
  getTestStats,
  getEventsByTest,
} from "@/lib/ab-tests";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ab-tests/[id]
 * Get a single A/B test with full stats and events.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const test = await getTestById(id);
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const stats = await getTestStats(id);
  const events = await getEventsByTest(id);

  return NextResponse.json({
    ...test,
    stats,
    totalImpressions: events.filter((e) => e.type === "impression").length,
    totalConversions: events.filter((e) => e.type === "conversion").length,
  });
}

/**
 * PATCH /api/admin/ab-tests/[id]
 * Update an A/B test (status, name, variants, etc.).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const test = await getTestById(id);
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Handle status transitions
    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["running"],
        running: ["paused", "completed"],
        paused: ["running", "completed"],
        completed: [], // Terminal state
      };

      if (!validTransitions[test.status]?.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from '${test.status}' to '${body.status}'`,
          },
          { status: 400 }
        );
      }

      updates.status = body.status;

      if (body.status === "running" && !test.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
      if (body.status === "paused") {
        updates.pausedAt = new Date().toISOString();
      }
      if (body.status === "completed") {
        updates.completedAt = new Date().toISOString();
      }
    }

    // Allow updating name and variants on draft tests
    if (body.name) updates.name = body.name;
    if (body.targetElement && test.status === "draft") {
      updates.targetElement = body.targetElement;
    }
    if (body.variants && test.status === "draft") {
      const totalWeight = body.variants.reduce(
        (sum: number, v: { weight: number }) => sum + v.weight,
        0
      );
      if (totalWeight !== 100) {
        return NextResponse.json(
          { error: "Variant weights must sum to 100" },
          { status: 400 }
        );
      }
      updates.variants = body.variants;
    }

    const updated = await updateTest(id, updates);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/ab-tests/[id]
 * Delete an A/B test and all its events.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteTest(id);
  if (!deleted) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
