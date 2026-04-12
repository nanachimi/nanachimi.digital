/**
 * Submission (Anfrage) store — persisted in PostgreSQL via Prisma.
 *
 * Status flow:
 *   pending → call_requested     (Kunde wählt Call → kein SLA)
 *   pending → sla_active         (Kunde wählt Angebot → SLA startet)
 *
 *   call_requested → amended     (Admin reviewed nach Call)
 *   sla_active → amended         (Admin reviewed innerhalb SLA)
 *   sla_active → sla_breached    (SLA abgelaufen)
 *   sla_breached → auto_generated (Auto-Angebot generiert)
 *
 *   amended → angebot_sent       (Angebot per E-Mail versendet)
 *   auto_generated → angebot_sent
 *
 *   angebot_sent → accepted      (Kunde nimmt an)
 *   angebot_sent → rejected_by_client (Kunde lehnt ab → Revision möglich)
 *   accepted → project_bootstrapped (Projekt automatisch aufgesetzt)
 *
 *   pending → rejected           (Admin lehnt ab)
 */

import { prisma } from "@/lib/db";
import type { ProjectPlan } from "@/lib/plan-template";
import type { RiskLevel } from "@/lib/pricing-config";

export type SubmissionStatus =
  | "pending"
  | "call_requested"
  | "sla_active"
  | "sla_breached"
  | "auto_generated"
  | "amended"
  | "angebot_sent"
  | "accepted"
  | "rejected"
  | "rejected_by_client"
  | "project_bootstrapped";

export interface SubmissionAmendment {
  plan: ProjectPlan;
  adminFestpreis: number;
  adminAufwand: number; // Personentage
  adminNotes?: string;
  amendedAt: string;
}

export interface Submission {
  id: string;
  createdAt: string;
  status: SubmissionStatus;

  // Contact
  name: string;
  email: string;
  firma?: string;
  telefon?: string;

  // WhatsApp consent (DSGVO)
  whatsappConsent: boolean;
  whatsappConsentAt?: string;
  whatsappConsentVersion?: string;

  // Project
  projekttyp: string;
  beschreibung: string;
  zielgruppe?: string;
  funktionen: string[];
  rollenAnzahl: string;
  rollenName?: string;
  rollenBeschreibung?: string;
  appStruktur?: "shared" | "separate";
  rollenApps?: { rolle: string; appTyp: string[]; beschreibung?: string }[];
  designLevel: string;
  zeitrahmenMvp: string;
  zeitrahmenFinal: string;
  budget: string;
  betriebUndWartung: string;
  betriebLaufzeit?: string;
  zusatzinfo?: string;

  // Branding & Artifacts
  markenname?: string;
  domain?: string;
  brandingInfo?: string;

  // Funktionen-Gruppen-Zuordnung
  funktionenGruppen?: Record<string, string[]>;

  // Inspiration & Monetarisierung
  inspirationUrls?: { url: string; beschreibung: string }[];
  monetarisierung?: string[];
  monetarisierungDetails?: string;
  werZahlt?: string;
  zahlendeGruppen?: string[];

  // Preference
  naechsterSchritt: "call" | "angebot";

  // Client feedback (when rejecting an Angebot)
  clientFeedback?: string;

  // Linked booking (when customer books a call)
  bookingId?: string;

  // Admin amendment (LLM plan + pricing)
  amendment?: SubmissionAmendment;

  // Internal auto-estimate (never shown to customer, reference for admin)
  estimate: {
    festpreis: number;
    aufwand: number; // Personentage
    weeklyRate: number;
    assumptions: string[];
    exclusions: string[];
    riskLevel: RiskLevel;
  };

  // Preliminary range shown to customer
  range?: {
    untergrenze: number;
    obergrenze: number;
  };

  // SLA fields
  riskLevel?: RiskLevel;
  slaMinutes?: number;
  slaDeadline?: string; // ISO timestamp
  slaStartedAt?: string; // ISO timestamp
  slaBreachedAt?: string; // ISO timestamp — set once, never cleared

  // Demand factor at time of submission
  demandFactor?: number;

  // Attribution & promo (affiliate system)
  visitorId?: string;
  promoCode?: string;
  promoCodeId?: string;
  affiliateId?: string; // winner — promo code or fallback cookie
  firstTouchAffiliateId?: string; // analytics — first cookie touch
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

function dbToSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as string,
    createdAt: (row.createdAt as Date).toISOString(),
    status: row.status as SubmissionStatus,
    name: row.name as string,
    email: row.email as string,
    firma: (row.firma as string) || undefined,
    telefon: (row.telefon as string) || undefined,
    whatsappConsent: (row.whatsappConsent as boolean) ?? false,
    whatsappConsentAt: row.whatsappConsentAt ? (row.whatsappConsentAt as Date).toISOString() : undefined,
    whatsappConsentVersion: (row.whatsappConsentVersion as string) || undefined,
    projekttyp: row.projekttyp as string,
    beschreibung: row.beschreibung as string,
    zielgruppe: row.zielgruppe as string,
    funktionen: row.funktionen as string[],
    rollenAnzahl: row.rollenAnzahl as string,
    rollenName: (row.rollenName as string) || undefined,
    rollenBeschreibung: (row.rollenBeschreibung as string) || undefined,
    appStruktur: (row.appStruktur as string as "shared" | "separate") || undefined,
    rollenApps: row.rollenApps as Submission["rollenApps"] ?? undefined,
    designLevel: row.designLevel as string,
    zeitrahmenMvp: row.zeitrahmenMvp as string,
    zeitrahmenFinal: row.zeitrahmenFinal as string,
    budget: row.budget as string,
    betriebUndWartung: row.betriebUndWartung as string,
    betriebLaufzeit: (row.betriebLaufzeit as string) || undefined,
    zusatzinfo: (row.zusatzinfo as string) || undefined,
    markenname: (row.markenname as string) || undefined,
    domain: (row.domain as string) || undefined,
    brandingInfo: (row.brandingInfo as string) || undefined,
    funktionenGruppen: row.funktionenGruppen as Submission["funktionenGruppen"] ?? undefined,
    inspirationUrls: row.inspirationUrls as Submission["inspirationUrls"] ?? undefined,
    monetarisierung: (row.monetarisierung as string[]) || undefined,
    monetarisierungDetails: (row.monetarisierungDetails as string) || undefined,
    werZahlt: (row.werZahlt as string) || undefined,
    zahlendeGruppen: (row.zahlendeGruppen as string[]) || undefined,
    naechsterSchritt: row.naechsterSchritt as "call" | "angebot",
    clientFeedback: (row.clientFeedback as string) || undefined,
    bookingId: (row.bookingId as string) || undefined,
    amendment: row.amendment as Submission["amendment"] ?? undefined,
    estimate: row.estimate as Submission["estimate"],
    range: row.range as Submission["range"] ?? undefined,
    riskLevel: (row.riskLevel as RiskLevel) || undefined,
    slaMinutes: (row.slaMinutes as number) ?? undefined,
    slaDeadline: row.slaDeadline ? (row.slaDeadline as Date).toISOString() : undefined,
    slaStartedAt: row.slaStartedAt ? (row.slaStartedAt as Date).toISOString() : undefined,
    slaBreachedAt: row.slaBreachedAt ? (row.slaBreachedAt as Date).toISOString() : undefined,
    demandFactor: (row.demandFactor as number) ?? undefined,
    visitorId: (row.visitorId as string) || undefined,
    promoCode: (row.promoCode as string) || undefined,
    promoCodeId: (row.promoCodeId as string) || undefined,
    affiliateId: (row.affiliateId as string) || undefined,
    firstTouchAffiliateId: (row.firstTouchAffiliateId as string) || undefined,
    utmSource: (row.utmSource as string) || undefined,
    utmMedium: (row.utmMedium as string) || undefined,
    utmCampaign: (row.utmCampaign as string) || undefined,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────

export async function addSubmission(submission: Submission): Promise<void> {
  await prisma.submission.create({
    data: {
      id: submission.id,
      status: submission.status,
      name: submission.name,
      email: submission.email,
      firma: submission.firma ?? null,
      telefon: submission.telefon ?? null,
      whatsappConsent: submission.whatsappConsent,
      whatsappConsentAt: submission.whatsappConsentAt ? new Date(submission.whatsappConsentAt) : null,
      whatsappConsentVersion: submission.whatsappConsentVersion ?? null,
      projekttyp: submission.projekttyp,
      beschreibung: submission.beschreibung,
      zielgruppe: submission.zielgruppe ?? null,
      funktionen: submission.funktionen,
      rollenAnzahl: submission.rollenAnzahl,
      rollenName: submission.rollenName ?? null,
      rollenBeschreibung: submission.rollenBeschreibung ?? null,
      appStruktur: submission.appStruktur ?? null,
      rollenApps: submission.rollenApps ? JSON.parse(JSON.stringify(submission.rollenApps)) : undefined,
      designLevel: submission.designLevel,
      zeitrahmenMvp: submission.zeitrahmenMvp,
      zeitrahmenFinal: submission.zeitrahmenFinal,
      budget: submission.budget,
      betriebUndWartung: submission.betriebUndWartung,
      betriebLaufzeit: submission.betriebLaufzeit ?? null,
      zusatzinfo: submission.zusatzinfo ?? null,
      markenname: submission.markenname ?? null,
      domain: submission.domain ?? null,
      brandingInfo: submission.brandingInfo ?? null,
      funktionenGruppen: submission.funktionenGruppen ? JSON.parse(JSON.stringify(submission.funktionenGruppen)) : undefined,
      inspirationUrls: submission.inspirationUrls ? JSON.parse(JSON.stringify(submission.inspirationUrls)) : undefined,
      monetarisierung: submission.monetarisierung ?? [],
      monetarisierungDetails: submission.monetarisierungDetails ?? null,
      werZahlt: submission.werZahlt ?? null,
      zahlendeGruppen: submission.zahlendeGruppen ?? [],
      naechsterSchritt: submission.naechsterSchritt,
      clientFeedback: submission.clientFeedback ?? null,
      bookingId: submission.bookingId ?? null,
      estimate: JSON.parse(JSON.stringify(submission.estimate)),
      range: submission.range ? JSON.parse(JSON.stringify(submission.range)) : undefined,
      riskLevel: submission.riskLevel ?? null,
      slaMinutes: submission.slaMinutes ?? null,
      slaDeadline: submission.slaDeadline ? new Date(submission.slaDeadline) : null,
      slaStartedAt: submission.slaStartedAt ? new Date(submission.slaStartedAt) : null,
      demandFactor: submission.demandFactor ?? null,
      amendment: submission.amendment ? JSON.parse(JSON.stringify(submission.amendment)) : undefined,
      visitorId: submission.visitorId ?? null,
      promoCode: submission.promoCode ?? null,
      promoCodeId: submission.promoCodeId ?? null,
      affiliateId: submission.affiliateId ?? null,
      firstTouchAffiliateId: submission.firstTouchAffiliateId ?? null,
      utmSource: submission.utmSource ?? null,
      utmMedium: submission.utmMedium ?? null,
      utmCampaign: submission.utmCampaign ?? null,
    },
  });
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => dbToSubmission(r as unknown as Record<string, unknown>));
}

export async function getSubmissionById(id: string): Promise<Submission | undefined> {
  const row = await prisma.submission.findUnique({ where: { id } });
  if (!row) return undefined;
  return dbToSubmission(row as unknown as Record<string, unknown>);
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  feedback?: string
): Promise<Submission | undefined> {
  try {
    const row = await prisma.submission.update({
      where: { id },
      data: {
        status,
        ...(feedback ? { clientFeedback: feedback } : {}),
        ...(status === "sla_breached" ? { slaBreachedAt: new Date() } : {}),
      },
    });
    return dbToSubmission(row as unknown as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export async function updateSubmissionAmendment(
  id: string,
  amendment: SubmissionAmendment
): Promise<Submission | undefined> {
  try {
    const row = await prisma.submission.update({
      where: { id },
      data: {
        amendment: JSON.parse(JSON.stringify(amendment)),
        status: "amended",
      },
    });
    return dbToSubmission(row as unknown as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

/**
 * Get submissions approaching or past their SLA deadline.
 * Triggers 5 minutes BEFORE deadline so the auto-Angebot arrives on time.
 */
export async function getDueSlaSubmissions(): Promise<Submission[]> {
  const buffer = new Date(Date.now() + 5 * 60 * 1000); // 5 min ahead
  const rows = await prisma.submission.findMany({
    where: {
      status: "sla_active",
      slaDeadline: { lt: buffer },
    },
  });
  return rows.map((r) => dbToSubmission(r as unknown as Record<string, unknown>));
}

/** @deprecated Use getDueSlaSubmissions instead */
export const getBreachedSlaSubmissions = getDueSlaSubmissions;
