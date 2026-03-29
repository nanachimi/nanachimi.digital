import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { requireAdmin } from "@/lib/auth/require-admin";

// GET /api/admin/angebote/[id] — Get a single Angebot (admin view)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const angebot = await getAngebotById(id);

  if (!angebot) {
    return NextResponse.json(
      { error: "Angebot nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(angebot);
}
