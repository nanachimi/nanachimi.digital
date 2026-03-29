import { NextResponse } from "next/server";
import {
  getSubmissionById,
  updateSubmissionAmendment,
} from "@/lib/submissions";
import type { ProjectPlan } from "@/lib/plan-template";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";

interface AmendBody {
  plan: ProjectPlan;
  festpreis: number;
  aufwand: number; // Personentage
  adminNotes?: string;
}

// PATCH /api/admin/submissions/[id]/amend
// Saves the amendment (LLM plan + admin pricing) to the Anfrage
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) {
    return NextResponse.json(
      { error: "Anfrage nicht gefunden" },
      { status: 404 }
    );
  }

  // Allow amendment for various pre-sent statuses
  const amendableStatuses = [
    "pending",
    "call_requested",
    "sla_active",
    "sla_breached",
    "auto_generated",
    "amended",
    "rejected_by_client",
  ];
  if (!amendableStatuses.includes(submission.status)) {
    return NextResponse.json(
      {
        error:
          "Anfrage kann in diesem Status nicht bearbeitet werden",
      },
      { status: 400 }
    );
  }

  const body = (await request.json()) as AmendBody;

  if (!body.plan || !body.festpreis || !body.aufwand) {
    return NextResponse.json(
      { error: "Plan, Festpreis und Aufwand sind erforderlich" },
      { status: 400 }
    );
  }

  const updated = await updateSubmissionAmendment(id, {
    plan: body.plan,
    adminFestpreis: body.festpreis,
    adminAufwand: body.aufwand,
    adminNotes: body.adminNotes,
    amendedAt: new Date().toISOString(),
  });

  return NextResponse.json(updated);
}
