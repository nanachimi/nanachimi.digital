/**
 * Pricing Configuration Store — admin-editable via /admin/settings.
 *
 * Persisted in PostgreSQL via Prisma (PricingConfig table).
 * Falls back to DEFAULT_PRICING_CONFIG if no DB record exists.
 */

import { prisma } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export interface WeeklyRates {
  "48h": number;
  "1-2wochen": number;
  "1monat": number;
  flexibel: number;
}

export interface FeatureDays {
  [featureName: string]: number;
}

export interface BWPackage {
  months: number;
  pricePerMonth: number;
}

export interface Tranche {
  prozent: number;
  label: string;
}

export interface RiskThresholds {
  lowMaxFeatures: number;
  mediumMaxFeatures: number;
  // high = anything above mediumMaxFeatures
}

export interface DemandConfig {
  maxCapacity: number; // max active projects per week
  maxSurcharge: number; // max demand factor multiplier (e.g. 0.20 = 20%)
  adminOverride: number; // manual override factor (0 = disabled, e.g. 1.15)
}

export interface AutoAngebotLimits {
  minPrice: number;
  maxPrice: number;
}

export interface PricingConfig {
  weeklyRates: WeeklyRates;
  featureDays: FeatureDays;
  bwPackages: BWPackage[];
  bwIncludedMonths: number; // months included in Festpreis
  zahlungsbedingungen: Tranche[];
  riskThresholds: RiskThresholds;
  demand: DemandConfig;
  autoAngebotLimits: AutoAngebotLimits;
  baseSetupDays: number;
}

// ─── Defaults ─────────────────────────────────────────────────────

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  weeklyRates: {
    "48h": 1000,
    "1-2wochen": 700,
    "1monat": 600,
    flexibel: 495,
  },
  featureDays: {
    // User-facing labels (as shown in onboarding)
    "Anmeldung & Benutzerkonten": 1,
    "Verwaltungsbereich": 2,
    "Online bezahlen": 2.5,
    "E-Mail-Benachrichtigungen": 0.5,
    "Push-Nachrichten aufs Handy": 1,
    "Chat-Funktion": 2.5,
    "Suche & Filter": 1,
    "Dateien hochladen": 0.5,
    "Anbindung an andere Systeme": 1.5,
    "Mehrere Sprachen": 1,
    "Auswertungen & Statistiken": 2,
    "Unterschiedliche Zugriffsrechte": 1.5,
    // Legacy keys (for existing submissions created before label change)
    "Benutzer-Authentifizierung": 1,
    "Admin-Dashboard": 2,
    "Zahlungsintegration": 2.5,
    "Push-Benachrichtigungen": 1,
    "Echtzeit-Chat": 2.5,
    "Datei-Upload": 0.5,
    "API-Integration": 1.5,
    "Mehrsprachigkeit": 1,
    "Reporting & Analytics": 2,
    "Rollenbasierte Zugriffskontrolle": 1.5,
  },
  bwPackages: [
    { months: 3, pricePerMonth: 69 },
    { months: 6, pricePerMonth: 49 },
    { months: 12, pricePerMonth: 29 },
  ],
  bwIncludedMonths: 1,
  zahlungsbedingungen: [
    { prozent: 15, label: "Vor Projektstart" },
    { prozent: 35, label: "Nach MVP-Lieferung" },
    { prozent: 50, label: "Vor Go-Live / Vor Übergabe" },
  ],
  riskThresholds: {
    lowMaxFeatures: 5,
    mediumMaxFeatures: 8,
  },
  demand: {
    maxCapacity: 3,
    maxSurcharge: 0.20,
    adminOverride: 0,
  },
  autoAngebotLimits: {
    minPrice: 299,
    maxPrice: 4999,
  },
  baseSetupDays: 2,
};

// ─── Store ────────────────────────────────────────────────────────

export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const record = await prisma.pricingConfig.findUnique({
      where: { id: "default" },
    });
    if (record) {
      return record.config as unknown as PricingConfig;
    }
  } catch (err) {
    console.error("[PricingConfig] DB read failed, using defaults:", err);
  }
  return structuredClone(DEFAULT_PRICING_CONFIG);
}

export async function updatePricingConfig(
  partial: Partial<PricingConfig>
): Promise<PricingConfig> {
  const current = await getPricingConfig();
  const updated = { ...current, ...partial };
  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    update: { config: JSON.parse(JSON.stringify(updated)) },
    create: { id: "default", config: JSON.parse(JSON.stringify(updated)) },
  });
  return updated;
}

// ─── Demand Factor Calculation ────────────────────────────────────

/**
 * Calculate the demand factor based on active project count.
 *
 * aktiveProjekte = submissions with status "accepted" or "angebot_sent" (last 7 days)
 * berechneterFaktor = 1.0 + (aktiveProjekte / maxKapazität) × maxSurcharge
 * effektiverFaktor = max(adminOverride, berechneterFaktor)
 */
export async function calculateDemandFactor(): Promise<{
  activeProjects: number;
  calculatedFactor: number;
  effectiveFactor: number;
}> {
  const config = await getPricingConfig();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeProjects = await prisma.submission.count({
    where: {
      status: { in: ["accepted", "angebot_sent"] },
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const calculatedFactor =
    1.0 +
    (Math.min(activeProjects, config.demand.maxCapacity) /
      config.demand.maxCapacity) *
      config.demand.maxSurcharge;

  const effectiveFactor =
    config.demand.adminOverride > 0
      ? Math.max(config.demand.adminOverride, calculatedFactor)
      : calculatedFactor;

  return {
    activeProjects,
    calculatedFactor: Math.round(calculatedFactor * 100) / 100,
    effectiveFactor: Math.round(effectiveFactor * 100) / 100,
  };
}

// ─── SLA Duration ─────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

/** SLA duration in minutes by risk level */
export function getSlaMinutes(risk: RiskLevel): number {
  switch (risk) {
    case "low":
      return 30;
    case "medium":
      return 60;
    case "high":
      return 120;
  }
}
