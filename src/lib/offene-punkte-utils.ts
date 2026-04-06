/**
 * Offene Punkte Utilities — shared pure functions for formatting
 * and evaluating offene Punkte from the project plan.
 *
 * Used by:
 * - Admin backoffice (recommendation banner)
 * - Angebot PDF (customer-facing assumptions)
 * - Angebot web page (customer-facing assumptions)
 * - Email (offenePunkteCount hint)
 */

import type { OffenerPunkt } from "@/lib/plan-template";

// ─── Empfehlung (Recommendation) ────────────────────────────────

export type Empfehlung = "green" | "yellow" | "red";

/**
 * Determine the recommendation level based on offene Punkte.
 *
 * - red:    at least 1× inkonsistenz with prioritaet "hoch"
 *           → Admin should clarify before sending Angebot
 * - yellow: at least 1× inkonsistenz with prioritaet "mittel"
 *           → Send Angebot, but address the inkonsistenz
 * - green:  everything else
 *           → Send Angebot with assumptions
 */
export function getOffenePunkteEmpfehlung(punkte: OffenerPunkt[]): Empfehlung {
  const inkonsistenzen = punkte.filter((p) => p.typ === "inkonsistenz");

  if (inkonsistenzen.some((p) => p.prioritaet === "hoch")) {
    return "red";
  }

  if (inkonsistenzen.some((p) => p.prioritaet === "mittel")) {
    return "yellow";
  }

  return "green";
}

// ─── Empfehlung Config ───────────────────────────────────────────

export const EMPFEHLUNG_CONFIG: Record<
  Empfehlung,
  {
    label: string;
    beschreibung: string;
    icon: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  green: {
    label: "Angebot senden",
    beschreibung:
      "Alle offenen Punkte sind durch unsere Annahmen abgedeckt. Das Angebot kann direkt gesendet werden.",
    icon: "✓",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/20",
    textClass: "text-green-400",
    iconClass: "text-green-400",
  },
  yellow: {
    label: "Angebot senden — Inkonsistenz beachten",
    beschreibung:
      "Es gibt eine mittlere Inkonsistenz in den Anforderungen. Das Angebot kann gesendet werden, aber die Annahmen sollten im Begleittext angesprochen werden.",
    icon: "⚠",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/20",
    textClass: "text-yellow-400",
    iconClass: "text-yellow-400",
  },
  red: {
    label: "Erst Rücksprache — schwerwiegende Inkonsistenz",
    beschreibung:
      "Es gibt eine schwerwiegende Inkonsistenz (hohe Priorität). Vor dem Versand des Angebots sollte eine Absprache mit dem Kunden stattfinden.",
    icon: "✕",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    textClass: "text-red-400",
    iconClass: "text-red-400",
  },
};

// ─── Customer-facing Formatting ──────────────────────────────────

export interface CustomerPunkt {
  icon: "check" | "warning";
  titel: string;
  text: string;
}

/**
 * Format an OffenerPunkt into a customer-friendly assumption.
 *
 * Instead of "Es fehlt X" → "Wir gehen davon aus, dass Y"
 * The vorschlag becomes the positive assumption text.
 */
export function formatOffenerPunktForCustomer(
  punkt: OffenerPunkt
): CustomerPunkt {
  // Inkonsistenz and high-priority risks get a warning icon
  const icon: "check" | "warning" =
    punkt.typ === "inkonsistenz" ||
    (punkt.typ === "risiko" && punkt.prioritaet === "hoch")
      ? "warning"
      : "check";

  // Transform the vorschlag into a positive assumption
  const text = punkt.vorschlag.startsWith("Wir")
    ? punkt.vorschlag
    : `Wir gehen davon aus: ${punkt.vorschlag}`;

  return {
    icon,
    titel: punkt.titel,
    text,
  };
}

// ─── Filter for Customer Display ─────────────────────────────────

/**
 * Determine if a punkt should be shown to the customer.
 *
 * Filters out internal markers (e.g. auto-generated plan marker)
 * that are only relevant for the admin.
 */
export function shouldShowToCustomer(punkt: OffenerPunkt): boolean {
  // Filter out the auto-generation marker
  if (
    punkt.titel === "Automatisch generierter Plan" ||
    punkt.titel.toLowerCase().includes("auto-generiert") ||
    punkt.titel.toLowerCase().includes("automatisch generiert")
  ) {
    return false;
  }

  return true;
}
