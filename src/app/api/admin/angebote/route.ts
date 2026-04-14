import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSubmissionById,
  updateSubmissionStatus,
} from "@/lib/submissions";
import {
  addAngebot,
  getAngeboteBySubmission,
} from "@/lib/angebote";
import { sendAngebotEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/require-admin";
import { shouldShowToCustomer } from "@/lib/offene-punkte-utils";
export const dynamic = "force-dynamic";

const createAngebotSchema = z.object({
  submissionId: z.string().min(1, "submissionId ist erforderlich"),
});

// POST /api/admin/angebote — Create a new Angebot from an amended Anfrage
export async function POST(request: Request) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = createAngebotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "submissionId ist erforderlich" },
      { status: 400 }
    );
  }

  const { submissionId } = parsed.data;

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return NextResponse.json(
      { error: "Anfrage nicht gefunden" },
      { status: 404 }
    );
  }

  // Must have an amendment before creating an Angebot
  if (!submission.amendment) {
    return NextResponse.json(
      {
        error:
          "Die Anfrage muss zuerst bearbeitet werden (Projektplan + Preisgestaltung)",
      },
      { status: 400 }
    );
  }

  // Only allow from amended or rejected_by_client (for revised offers)
  if (!["amended", "rejected_by_client"].includes(submission.status)) {
    return NextResponse.json(
      {
        error:
          "Angebot kann nur aus einer bearbeiteten oder vom Kunden abgelehnten Anfrage erstellt werden",
      },
      { status: 400 }
    );
  }

  // Determine version number
  const existing = await getAngeboteBySubmission(submissionId);
  const version = existing.length + 1;

  const angebotId = `ang_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const angebot = {
    id: angebotId,
    submissionId,
    version,
    status: "sent" as const,
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    festpreis: submission.amendment.adminFestpreis,
    aufwand: submission.amendment.adminAufwand,
    plan: submission.amendment.plan,
    adminNotes: submission.amendment.adminNotes,
  };

  await addAngebot(angebot);

  // Update submission status
  await updateSubmissionStatus(submissionId, "angebot_sent");

  // Send email to customer with Angebot link
  try {
    // Count customer-visible offene Punkte
    const offenePunkteCount =
      submission.amendment?.plan?.offenePunkte?.filter(shouldShowToCustomer)
        .length ?? 0;

    await sendAngebotEmail({
      to: submission.email,
      kundenName: submission.name,
      firma: submission.firma,
      angebotId,
      festpreis: angebot.festpreis,
      aufwand: angebot.aufwand,
      projektBeschreibung: submission.beschreibung,
      offenePunkteCount,
    });
  } catch (emailError) {
    console.error("[Angebot] Email sending failed:", emailError);
    // Don't fail the Angebot creation if email fails
  }

  return NextResponse.json(angebot, { status: 201 });
}
