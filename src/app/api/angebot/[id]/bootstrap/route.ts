import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { generateProjectWithAI, createProjectZip } from "@/lib/project-bootstrap";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/angebot/[id]/bootstrap
 * Generates a complete project scaffold using Claude AI and returns a ZIP.
 * Only works for accepted Angebote.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const angebot = await getAngebotById(id);
  if (!angebot) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  if (angebot.status !== "accepted") {
    return NextResponse.json(
      { error: "Angebot muss zuerst angenommen werden" },
      { status: 403 }
    );
  }

  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) {
    return NextResponse.json(
      { error: "Anfrage nicht gefunden" },
      { status: 404 }
    );
  }

  try {
    // Generate project files with AI
    const result = await generateProjectWithAI(submission, angebot);

    if (!result.success || result.files.length === 0) {
      return NextResponse.json(
        { error: result.error || "Projektgenerierung fehlgeschlagen" },
        { status: 500 }
      );
    }

    // Create ZIP
    const zipBuffer = await createProjectZip(result.files);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.projectName}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (err) {
    console.error("[Bootstrap API] Error:", err);
    return NextResponse.json(
      { error: "Projektgenerierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
