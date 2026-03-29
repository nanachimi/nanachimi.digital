import ReactPDF from "@react-pdf/renderer";
import { AngebotPdfDocument } from "./angebot-pdf";
import type { ProjectPlan } from "@/lib/plan-template";

export interface AngebotPdfData {
  angebotId: string;
  kundenName: string;
  firma?: string;
  email: string;
  festpreis: number;
  aufwand: number;
  projektBeschreibung: string;
  plan: ProjectPlan;
  createdAt: string;
}

/**
 * Generate a professional PDF for an Angebot.
 * Returns a Buffer that can be stored (SeaweedFS) or attached to an email.
 */
export async function generateAngebotPdf(data: AngebotPdfData): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(
    AngebotPdfDocument({ data })
  );

  // Collect stream into Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
