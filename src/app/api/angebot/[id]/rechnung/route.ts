import { NextResponse } from "next/server";
import { getAngebotById } from "@/lib/angebote";
import { getSubmissionById } from "@/lib/submissions";
import { downloadFile } from "@/lib/seaweedfs";
import { generateRechnungPdf } from "@/lib/pdf/generate";
import { getCompanySettings } from "@/lib/company-settings";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/angebot/[id]/rechnung — Download Rechnung as PDF
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const angebot = await getAngebotById(id);

  if (!angebot) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Find paid payment for this angebot
  const payment = await prisma.payment.findFirst({
    where: { angebotId: id, status: "paid" },
    orderBy: { paidAt: "desc" },
  });

  if (!payment) {
    return NextResponse.json(
      { error: "Keine bezahlte Rechnung gefunden" },
      { status: 404 }
    );
  }

  let pdfBuffer: Buffer;

  if (payment.rechnungFileId) {
    // Try to fetch from SeaweedFS
    try {
      pdfBuffer = await downloadFile(payment.rechnungFileId);
    } catch {
      console.warn("[Rechnung] SeaweedFS download failed, generating on-the-fly");
      pdfBuffer = await generateOnTheFly(angebot, payment);
    }
  } else {
    // No stored PDF — generate on-the-fly
    pdfBuffer = await generateOnTheFly(angebot, payment);
  }

  const filename = payment.rechnungNummer
    ? `Rechnung-${payment.rechnungNummer}.pdf`
    : `Rechnung-${id}.pdf`;

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateOnTheFly(angebot: any, payment: any): Promise<Buffer> {
  const submission = await getSubmissionById(angebot.submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  const company = await getCompanySettings();
  return generateRechnungPdf({
    rechnungNummer: payment.rechnungNummer || "RE-ENTWURF",
    angebotId: angebot.angebotNummer || angebot.id,
    kundenName: submission.name,
    firma: submission.firma,
    email: submission.email,
    projektBeschreibung: submission.beschreibung,
    amount: payment.amount / 100, // cents to euros
    discount: payment.discount / 100,
    discountLabel: payment.type === "full" ? "Gesamtzahlung (12%)" : payment.type === "half" ? "50% Anzahlung (5%)" : undefined,
    paymentType: payment.type,
    paidAt: payment.paidAt?.toISOString() || new Date().toISOString(),
    createdAt: payment.createdAt.toISOString(),
    company,
  });
}
