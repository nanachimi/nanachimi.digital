import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/submissions";
import { getAngeboteBySubmission } from "@/lib/angebote";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";

// GET /api/admin/submissions/[id]/angebote — List all Angebote for an Anfrage
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

  const angebote = await getAngeboteBySubmission(id);
  return NextResponse.json({ angebote });
}
