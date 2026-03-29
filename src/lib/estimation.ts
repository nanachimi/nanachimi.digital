/**
 * Estimation engine — calculates project costs using admin-configurable pricing.
 *
 * Two-stage pricing:
 * 1. Preliminary estimate (range) — shown to customer after onboarding
 * 2. Final Festpreis — set by admin or auto-generated, sent via email
 */

import {
  getPricingConfig,
  calculateDemandFactor,
  type PricingConfig,
  type RiskLevel,
} from "@/lib/pricing-config";
import { CUSTOM_FEATURE_PREFIX } from "@/lib/onboarding-schema";

// ─── Input / Output ───────────────────────────────────────────────

export interface EstimationInput {
  projekttyp: string;
  funktionen: string[];
  rollenAnzahl: string;
  designLevel: string;
  zeitrahmenMvp: string;
  zeitrahmenFinal: string;
  budget?: string;
  betriebUndWartung?: string;
  appStruktur?: "shared" | "separate";
  rollenApps?: { rolle: string; appTyp: string[] }[];
}

export interface EstimationOutput {
  festpreis: number;
  aufwand: number; // Personentage
  weeklyRate: number;
  dailyRate: number;
  assumptions: string[];
  exclusions: string[];
  riskLevel: RiskLevel;
  // Preliminary range for customer
  range: {
    untergrenze: number;
    obergrenze: number;
  };
  // Demand factor applied
  demandFactor: number;
  // B&W info
  bwInfo: {
    includedMonths: number;
    packages: { months: number; pricePerMonth: number }[];
    customerWants: boolean; // true if betriebUndWartung === "ja" | "teilweise"
  };
  // SLA minutes based on risk
  slaMinutes: number;
}

// ─── Multipliers (unchanged) ──────────────────────────────────────

const PLATFORM_MULTIPLIERS: Record<string, number> = {
  web: 1.0,
  mobile: 1.3,
  desktop: 1.4,
  beides: 1.8,
  unsicher: 1.2,
};

const ROLE_MULTIPLIERS: Record<string, number> = {
  "1": 1.0,
  "2": 1.15,
  "3+": 1.35,
};

const DESIGN_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  individuell: 1.2,
  premium: 1.4,
};

// ─── Risk Assessment ──────────────────────────────────────────────

function assessRisk(input: EstimationInput, config: PricingConfig): RiskLevel {
  const featureCount = input.funktionen.length;
  const appCount = input.rollenApps?.length ?? 0;

  // High risk conditions
  if (
    featureCount > config.riskThresholds.mediumMaxFeatures ||
    input.zeitrahmenMvp === "48h" ||
    (input.appStruktur === "separate" && appCount >= 3) ||
    input.designLevel === "premium" ||
    input.budget === "10000-plus"
  ) {
    return "high";
  }

  // Medium risk conditions
  if (
    featureCount > config.riskThresholds.lowMaxFeatures ||
    input.projekttyp === "beides" ||
    input.projekttyp === "mobile" ||
    input.appStruktur === "separate" ||
    input.designLevel === "individuell"
  ) {
    return "medium";
  }

  return "low";
}

// ─── SLA Minutes ──────────────────────────────────────────────────

function getSlaMinutesForRisk(risk: RiskLevel): number {
  switch (risk) {
    case "low": return 30;
    case "medium": return 60;
    case "high": return 120;
  }
}

// ─── Core Calculation ─────────────────────────────────────────────

function calculateBasePrice(
  input: EstimationInput,
  config: PricingConfig,
  zeitrahmenOverride?: string
): { festpreis: number; aufwand: number; weeklyRate: number; dailyRate: number } {
  // 1. Sum up feature effort in dev-days
  let totalDays = config.baseSetupDays;
  const CUSTOM_FEATURE_DAYS = 1; // 1 day per custom feature
  for (const feature of input.funktionen) {
    if (feature.startsWith(CUSTOM_FEATURE_PREFIX)) {
      totalDays += CUSTOM_FEATURE_DAYS;
    } else {
      totalDays += config.featureDays[feature] || 1;
    }
  }

  // 2. Apply complexity multipliers
  const platformMul = PLATFORM_MULTIPLIERS[input.projekttyp] || 1.0;
  const roleMul = ROLE_MULTIPLIERS[input.rollenAnzahl] || 1.0;
  const designMul = DESIGN_MULTIPLIERS[input.designLevel] || 1.0;

  // Multi-app multiplier
  let multiAppMul = 1.0;
  if (input.appStruktur === "separate" && input.rollenApps) {
    const appCount = input.rollenApps.length;
    multiAppMul = 1.0 + (appCount - 1) * 0.6;
  }

  totalDays = totalDays * platformMul * roleMul * designMul * multiAppMul;

  // 3. Person-days (minimum 2)
  const aufwand = Math.max(2, Math.round(totalDays));

  // 4. Daily rate from weekly rate
  const zeitrahmen = zeitrahmenOverride || input.zeitrahmenMvp;
  const weeklyRate =
    config.weeklyRates[zeitrahmen as keyof typeof config.weeklyRates] ||
    config.weeklyRates.flexibel;
  const dailyRate = weeklyRate / 5;

  // 5. Fixed price (rounded to nearest 10)
  const festpreis = Math.round((aufwand * dailyRate) / 10) * 10;

  return { festpreis, aufwand, weeklyRate, dailyRate };
}

// ─── Main Export ──────────────────────────────────────────────────

export async function calculateEstimate(input: EstimationInput): Promise<EstimationOutput> {
  const config = await getPricingConfig();

  // Base price with customer's chosen timeline
  const base = calculateBasePrice(input, config);

  // Apply demand factor
  const { effectiveFactor } = await calculateDemandFactor();
  const festpreis = Math.round((base.festpreis * effectiveFactor) / 10) * 10;

  // Risk assessment
  const riskLevel = assessRisk(input, config);
  const slaMinutes = getSlaMinutesForRisk(riskLevel);

  // Preliminary range for customer display
  // untergrenze = price with cheapest rate ("flexibel")
  const flexBase = calculateBasePrice(input, config, "flexibel");
  const untergrenze =
    Math.round((flexBase.festpreis * effectiveFactor) / 10) * 10;

  // obergrenze = price with customer's timeline × 1.15 buffer
  let obergrenze = Math.round((festpreis * 1.15) / 10) * 10;

  // Minimum spread: obergrenze ≥ untergrenze × 1.20
  if (obergrenze < Math.round((untergrenze * 1.2) / 10) * 10) {
    obergrenze = Math.round((untergrenze * 1.2) / 10) * 10;
  }

  // B&W info
  const customerWantsBW =
    input.betriebUndWartung === "ja" ||
    input.betriebUndWartung === "teilweise";

  // Assumptions
  const platformLabel =
    input.projekttyp === "web"
      ? "Web-App"
      : input.projekttyp === "mobile"
        ? "Mobile App"
        : input.projekttyp === "desktop"
          ? "Desktop App"
          : input.projekttyp === "beides"
            ? "Mehrere Plattformen"
            : "Noch zu klären";

  const designLabel =
    input.designLevel === "standard"
      ? "Standard"
      : input.designLevel === "individuell"
        ? "Individuell"
        : "Premium";

  const featureCount = input.funktionen.length;
  const customFeatureCount = input.funktionen.filter((f) =>
    f.startsWith(CUSTOM_FEATURE_PREFIX)
  ).length;
  const hasPayments = input.funktionen.includes("Zahlungsintegration") ||
    input.funktionen.includes("Online bezahlen");
  const hasChat = input.funktionen.includes("Echtzeit-Chat") ||
    input.funktionen.includes("Chat-Funktion");
  const hasApi = input.funktionen.includes("API-Integration") ||
    input.funktionen.includes("Anbindung an andere Systeme");

  const assumptions: string[] = [
    `Plattform: ${platformLabel}`,
    `Design-Level: ${designLabel}`,
    `${featureCount} Features im vereinbarten Umfang${customFeatureCount > 0 ? ` (davon ${customFeatureCount} individuell)` : ""}`,
    "Standard-Geschäftslogik ohne komplexe Algorithmen",
    `Inkl. ${config.bwIncludedMonths} Monat Betrieb & Wartung nach Go-Live`,
  ];

  if (customerWantsBW) {
    assumptions.push("Inkl. Standard-Infrastruktur (CI/CD, Monitoring)");
  } else {
    assumptions.push("Ohne Infrastruktur-Setup (CI/CD, E-Mail, Monitoring)");
  }

  if (hasApi) {
    assumptions.push(
      "API-Integrationen beschränkt auf dokumentierte REST-Schnittstellen"
    );
  }

  if (input.appStruktur === "separate" && input.rollenApps) {
    const appDescriptions = input.rollenApps
      .map((a) => {
        const typLabel = Array.isArray(a.appTyp)
          ? a.appTyp.join(", ")
          : a.appTyp;
        return `${a.rolle} (${typLabel})`;
      })
      .join(", ");
    assumptions.push(`Separate Apps: ${appDescriptions}`);
    assumptions.push("Gemeinsames Backend, separate Frontends pro Rolle");
  } else if (input.appStruktur === "shared") {
    assumptions.push("Alle Rollen nutzen eine gemeinsame Anwendung");
  }

  // Exclusions
  const exclusions: string[] = [
    "Komplexe Algorithmen (ML, Echtzeit-Berechnungen, KI-Modelle)",
    "Datenbank-Migration bestehender Systeme",
  ];

  if (!hasPayments) {
    exclusions.push("Payment-Gateway-Integration (Stripe, PayPal, etc.)");
  }

  if (!customerWantsBW) {
    exclusions.push("CI/CD-Pipeline, E-Mail-Server und Monitoring-Setup");
    exclusions.push("Laufende Wartung, Updates und Support (nach dem 1. Monat)");
  }

  if (!hasChat) {
    exclusions.push(
      "Echtzeit-Funktionen (WebSockets, Chat, Live-Notifications)"
    );
  }

  exclusions.push("Umfangreiche Content-Erstellung und Datenpflege");
  exclusions.push("Laufende Hosting- und Infrastrukturkosten");

  return {
    festpreis,
    aufwand: base.aufwand,
    weeklyRate: base.weeklyRate,
    dailyRate: base.dailyRate,
    assumptions,
    exclusions,
    riskLevel,
    range: { untergrenze, obergrenze },
    demandFactor: effectiveFactor,
    bwInfo: {
      includedMonths: config.bwIncludedMonths,
      packages: config.bwPackages,
      customerWants: customerWantsBW,
    },
    slaMinutes,
  };
}
