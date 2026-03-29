import { NextResponse } from "next/server";
import { getSubmissionById, updateSubmissionStatus } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth/require-admin";

// GET /api/admin/submissions/[id] — get single submission
export async function GET(
  _request: Request,
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

  return NextResponse.json(submission);
}

// PATCH /api/admin/submissions/[id] — reject an Anfrage
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status: string };

  // Only "rejected" is a valid direct status change from admin
  // Other status transitions happen through specific endpoints:
  // - "amended" via /amend
  // - "angebot_sent" via /api/admin/angebote POST
  // - "accepted" / "rejected_by_client" via /api/angebot/[id] PATCH (customer)
  if (status !== "rejected") {
    return NextResponse.json(
      { error: "Nur 'rejected' ist als direkter Statuswechsel erlaubt" },
      { status: 400 }
    );
  }

  const updated = await updateSubmissionStatus(id, "rejected");

  if (!updated) {
    return NextResponse.json(
      { error: "Anfrage nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
