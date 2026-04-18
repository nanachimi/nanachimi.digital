import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { downloadFile } from "@/lib/seaweedfs";
import { formLimiter } from "@/lib/auth/rate-limit";
import { logger } from "@/lib/logger";
import { analyzePdf } from "@/lib/pdf-analysis";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  fileId: z.string().min(1),
  tempToken: z.string().min(1),
});

export async function POST(request: Request) {
  // 1. Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!formLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warten Sie einen Moment." },
      { status: 429 }
    );
  }

  // 2. Check API key availability
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn(
      { tag: "PdfAnalysis" },
      "ANTHROPIC_API_KEY not configured — returning fallback"
    );
    return NextResponse.json(
      {
        error:
          "Die KI-Analyse ist derzeit nicht verfügbar. Bitte nutzen Sie das klassische Formular.",
        fallback: true,
      },
      { status: 503 }
    );
  }

  // 3. Validate request body
  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await request.json();
    body = requestSchema.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "fileId und tempToken sind erforderlich." },
      { status: 400 }
    );
  }

  // 4. Look up file record with ownership check
  const file = await prisma.submissionFile.findFirst({
    where: {
      id: body.fileId,
      tempToken: body.tempToken,
    },
  });

  if (!file) {
    return NextResponse.json(
      { error: "Datei nicht gefunden oder Zugriff verweigert." },
      { status: 404 }
    );
  }

  // 5. Verify it's a PDF
  if (file.contentType !== "application/pdf") {
    return NextResponse.json(
      { error: "Nur PDF-Dateien werden unterstützt." },
      { status: 400 }
    );
  }

  // 6. Download from SeaweedFS
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadFile(file.seaweedFid);
  } catch (err) {
    logger.error(
      { tag: "PdfAnalysis", fileId: body.fileId, error: String(err) },
      "Failed to download PDF from SeaweedFS"
    );
    return NextResponse.json(
      {
        error: "Die Datei konnte nicht geladen werden. Bitte laden Sie sie erneut hoch.",
        fallback: true,
      },
      { status: 500 }
    );
  }

  // 7. Send to Claude for analysis
  try {
    const result = await analyzePdf(pdfBuffer, file.filename);
    return NextResponse.json(result);
  } catch (err) {
    logger.error(
      { tag: "PdfAnalysis", fileId: body.fileId, error: String(err) },
      "PDF analysis failed"
    );
    return NextResponse.json(
      {
        error:
          "Die automatische Analyse hat leider nicht geklappt. Bitte versuchen Sie es erneut.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
