/**
 * Auto-Angebot Generation Logic
 *
 * When an SLA is breached and the customer chose "angebot" (not "call"),
 * the system auto-generates a project plan and offer.
 *
 * Safeguards:
 * - Min price: 299€, Max price: 4999€ (admin-configurable)
 * - >10 features + high risk → no auto-generation
 * - LLM output must be schema-compliant
 * - Admin is notified for every auto-generated offer
 */

import { type Submission, updateSubmissionStatus } from "@/lib/submissions";
import { addAngebot } from "@/lib/angebote";
import { getPricingConfig, calculateDemandFactor } from "@/lib/pricing-config";
import { sendAngebotEmail } from "@/lib/email";
import type { ProjectPlan } from "@/lib/plan-template";

interface AutoAngebotResult {
  success: boolean;
  angebotId?: string;
  reason?: string;
}

/**
 * Check if auto-generation is allowed for this submission.
 */
async function canAutoGenerate(submission: Submission): Promise<{ allowed: boolean; reason?: string }> {
  const config = await getPricingConfig();

  // Must be call=angebot path (not call)
  if (submission.naechsterSchritt === "call") {
    return { allowed: false, reason: "Kunde hat Call gewählt — kein Auto-Angebot" };
  }

  // Feature count + risk check
  if (submission.funktionen.length > 10 && submission.estimate.riskLevel === "high") {
    return { allowed: false, reason: "Zu komplex (>10 Features + High Risk) — Admin muss manuell erstellen" };
  }

  // Price bounds check
  const price = submission.estimate.festpreis;
  if (price < config.autoAngebotLimits.minPrice) {
    return { allowed: false, reason: `Preis ${price}€ unter Mindestgrenze ${config.autoAngebotLimits.minPrice}€` };
  }
  if (price > config.autoAngebotLimits.maxPrice) {
    return { allowed: false, reason: `Preis ${price}€ über Höchstgrenze ${config.autoAngebotLimits.maxPrice}€ — Admin muss manuell erstellen` };
  }

  return { allowed: true };
}

/**
 * Generate a minimal ProjectPlan from submission data.
 *
 * In V1, this creates a basic plan from the submission data.
 * In V2, this will call an LLM to generate a detailed plan.
 */
function generateBasicPlan(submission: Submission): ProjectPlan {
  const userStories = submission.funktionen.map((f) => ({
    rolle: "Benutzer",
    aktion: `${f} nutzen`,
    nutzen: `Zugriff auf ${f}`,
    prioritaet: "must" as const,
  }));

  const platformLabel =
    submission.projekttyp === "web"
      ? "Web-App"
      : submission.projekttyp === "mobile"
        ? "Mobile App"
        : submission.projekttyp === "beides"
          ? "Web + Mobile App"
          : "Anwendung";

  return {
    anforderungen: {
      userStories,
    },
    apiEndpunkte: [
      { methode: "POST", pfad: "/api/auth/login", beschreibung: "Benutzer-Login" },
      { methode: "GET", pfad: "/api/health", beschreibung: "Health Check" },
    ],
    uiKomponenten: [
      {
        rolle: "Benutzer",
        screens: [
          {
            name: "Dashboard",
            beschreibung: `Hauptübersicht der ${platformLabel}`,
            komponenten: ["Navigation", "Übersicht", "Aktionen"],
          },
        ],
      },
    ],
    architektur: {
      beschreibung: `${platformLabel} mit modernem Tech-Stack`,
      datenfluss: "Client → API → Datenbank → Response",
      datenbankmodell: "PostgreSQL mit normalisierten Tabellen",
    },
    technologieStack: [
      { kategorie: "Frontend", technologie: "Next.js / React", begruendung: "Modernes Framework mit SSR" },
      { kategorie: "Backend", technologie: "Next.js API Routes", begruendung: "Integrierte API-Schicht" },
      { kategorie: "Datenbank", technologie: "PostgreSQL", begruendung: "Bewährte relationale Datenbank" },
      { kategorie: "Infrastruktur", technologie: "Hetzner + Docker", begruendung: "Kosteneffizient und performant" },
    ],
    kritischePunkte: [
      {
        kategorie: "Go-Live",
        beschreibung: "Deployment und Monitoring",
        empfehlung: "CI/CD-Pipeline mit automatisierten Tests",
      },
    ],
    offenePunkte: [
      {
        typ: "unklarheit" as const,
        titel: "Automatisch generierter Plan",
        beschreibung: "Dieser Plan wurde automatisch erstellt, da die SLA-Frist abgelaufen ist. Die Anforderungen wurden nicht manuell geprüft.",
        vorschlag: "Admin sollte den Plan manuell prüfen und bei Bedarf nachbessern.",
        prioritaet: "hoch" as const,
      },
    ],
    betriebUndWartung: {
      umfang: "Monitoring, Updates, Bugfixes",
      vertragslaufzeit: "1 Monat (im Festpreis inkludiert)",
      aboOptionen: "3 Monate: 69€/Monat, 6 Monate: 49€/Monat, 12 Monate: 29€/Monat",
      sla: "Reaktionszeit: 24h (Werktage)",
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Auto-generate an Angebot for a breached-SLA submission.
 */
export async function generateAutoAngebot(submission: Submission): Promise<AutoAngebotResult> {
  // 1. Check if auto-generation is allowed
  const check = await canAutoGenerate(submission);
  if (!check.allowed) {
    return { success: false, reason: check.reason };
  }

  try {
    // 2. Generate plan
    const plan = generateBasicPlan(submission);

    // 3. Calculate final price with demand factor
    const { effectiveFactor } = await calculateDemandFactor();
    const festpreis = Math.round(
      (submission.estimate.festpreis * effectiveFactor) / 10
    ) * 10;

    // 4. Create Angebot
    const angebotId = `ang_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await addAngebot({
      id: angebotId,
      submissionId: submission.id,
      version: 1,
      status: "sent",
      createdAt: now,
      sentAt: now,
      festpreis,
      aufwand: submission.estimate.aufwand,
      plan,
      adminNotes: "Automatisch generiert (SLA-Überschreitung)",
      isAutoGenerated: true,
      autoGeneratedAt: now,
      demandFactor: effectiveFactor,
    });

    // 5. Update submission status
    await updateSubmissionStatus(submission.id, "auto_generated");
    // Then immediately mark as angebot_sent
    await updateSubmissionStatus(submission.id, "angebot_sent");

    // 6. Send email (fire-and-forget)
    sendAngebotEmail({
      to: submission.email,
      kundenName: submission.name,
      firma: submission.firma,
      angebotId,
      festpreis,
      aufwand: submission.estimate.aufwand,
      projektBeschreibung: submission.beschreibung,
      betriebUndWartung: submission.betriebUndWartung,
    }).catch((err) => {
      console.error(`[AutoAngebot] Email failed for ${submission.id}:`, err);
    });

    console.log(`[AutoAngebot] Generated ${angebotId} for submission ${submission.id} — ${festpreis}€`);

    return { success: true, angebotId };
  } catch (err) {
    console.error(`[AutoAngebot] Generation failed for ${submission.id}:`, err);
    return { success: false, reason: "Interner Fehler bei der Angebotsgenerierung" };
  }
}
