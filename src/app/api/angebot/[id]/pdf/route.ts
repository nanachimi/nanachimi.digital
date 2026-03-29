import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { downloadFile } from "@/lib/seaweedfs";
import { generateAngebotPdf } from "@/lib/pdf/generate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/angebot/[id]/pdf — Download Angebot as PDF
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const angebot = await getAngebotById(id);

  if (!angebot) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Only accepted Angebote have a stored PDF; for others, generate on-the-fly
  let pdfBuffer: Buffer;

  if (angebot.pdfFileId) {
    // Try to fetch from SeaweedFS
    try {
      pdfBuffer = await downloadFile(angebot.pdfFileId);
    } catch {
      console.warn("[PDF] SeaweedFS download failed, generating on-the-fly");
      pdfBuffer = await generateOnTheFly(angebot, id);
    }
  } else {
    // No stored PDF — generate on-the-fly
    pdfBuffer = await generateOnTheFly(angebot, id);
  }

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Angebot-${id}.pdf"`,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateOnTheFly(angebot: any, id: string): Promise<Buffer> {
  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  return generateAngebotPdf({
    angebotId: id,
    kundenName: submission.name,
    firma: submission.firma,
    email: submission.email,
    festpreis: angebot.festpreis,
    aufwand: angebot.aufwand,
    projektBeschreibung: submission.beschreibung,
    plan: angebot.plan,
    createdAt: angebot.createdAt,
  });
}
