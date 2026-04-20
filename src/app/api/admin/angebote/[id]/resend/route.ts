import { NextResponse } from "next/server";
import { getAngebotById, updateAngebotStatus } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { sendAngebotEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/require-admin";
import { shouldShowToCustomer } from "@/lib/offene-punkte-utils";

export const dynamic = "force-dynamic";

// POST /api/admin/angebote/[id]/resend — re-send the Angebot email to the customer.
// Unlike the create endpoint, send failures bubble up as 502 so the operator sees them.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const angebot = await getAngebotById(id);
  if (!angebot) {
    return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  }

  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Zugehörige Anfrage nicht gefunden" }, { status: 404 });
  }

  const offenePunkteCount =
    angebot.plan?.offenePunkte?.filter(shouldShowToCustomer).length ?? 0;

  try {
    await sendAngebotEmail({
      to: submission.email,
      kundenName: submission.name,
      firma: submission.firma,
      angebotId: angebot.id,
      festpreis: angebot.festpreis,
      aufwand: angebot.aufwand,
      projektBeschreibung: submission.beschreibung,
      betriebUndWartung: submission.betriebUndWartung,
      offenePunkteCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Angebot] Resend failed:", err);
    return NextResponse.json(
      { error: "E-Mail-Versand fehlgeschlagen", detail: message },
      { status: 502 }
    );
  }

  await updateAngebotStatus(angebot.id, "sent");

  return NextResponse.json({ ok: true, angebotId: angebot.id, to: submission.email });
}
