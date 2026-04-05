import ReactPDF from "@react-pdf/renderer";
import { AngebotPdfDocument } from "./angebot-pdf";
import { RechnungPdfDocument } from "./rechnung-pdf";
import type { ProjectPlan } from "@/lib/plan-template";
import type { CompanyInfo } from "@/lib/company-settings";

export interface RechnungPdfData {
  rechnungNummer: string;  // e.g. "RE-2026-0001"
  angebotId: string;
  kundenName: string;
  kundenAdresse?: string;
  firma?: string;
  email: string;
  projektBeschreibung: string;
  amount: number;          // in euros (not cents), netto
  discount: number;        // in euros
  discountLabel?: string;  // e.g. "Gesamtzahlung (12%)"
  paymentType: string;     // "full" | "half" | "tranche_1"
  paidAt: string;          // ISO date
  createdAt: string;       // ISO date
  company: CompanyInfo;
}

export interface AngebotPdfData {
  angebotId: string;
  kundenName: string;
  kundenAdresse?: string;
  firma?: string;
  email: string;
  festpreis: number;
  aufwand: number;
  projektBeschreibung: string;
  plan: ProjectPlan;
  createdAt: string;
  deadline?: string; // ISO date string for project delivery deadline
  company: CompanyInfo;
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

/**
 * Generate a professional PDF for a Rechnung (invoice).
 * Returns a Buffer that can be stored (SeaweedFS) or attached to an email.
 */
export async function generateRechnungPdf(data: RechnungPdfData): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(
    RechnungPdfDocument({ data })
  );

  // Collect stream into Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
