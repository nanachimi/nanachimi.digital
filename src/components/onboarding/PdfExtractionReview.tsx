"use client";

import { CheckCircle2, AlertCircle, HelpCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { FEATURE_OPTIONS } from "@/lib/onboarding-schema";

interface Props {
  summary: string;
  extracted: Partial<OnboardingData>;
  confidence: Record<string, "high" | "medium" | "low">;
  missing: string[];
  onConfirm: () => void;
  onRestart: () => void;
}

const CONFIDENCE_STYLES = {
  high: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "Sicher",
  },
  medium: {
    icon: HelpCircle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "Abgeleitet",
  },
  low: {
    icon: AlertCircle,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    label: "Bitte prüfen",
  },
};

const FIELD_LABELS: Record<string, string> = {
  projekttyp: "Projekttyp",
  beschreibung: "Beschreibung",
  funktionen: "Funktionen",
  rollenAnzahl: "Benutzergruppen",
  rollenName: "Rollenname",
  rollenBeschreibung: "Rollenbeschreibung",
  appStruktur: "App-Struktur",
  designLevel: "Design-Level",
  zeitrahmenMvp: "MVP-Zeitrahmen",
  zeitrahmenFinal: "Finaler Zeitrahmen",
  budget: "Budget",
  betriebUndWartung: "Betrieb & Wartung",
  monetarisierung: "Monetarisierung",
  zielgruppe: "Zielgruppe",
  markenname: "Markenname",
  domain: "Domain",
  brandingInfo: "Branding-Info",
};

const PROJEKTTYP_LABELS: Record<string, string> = {
  web: "Webanwendung",
  mobile: "Mobile App",
  desktop: "Desktop-Anwendung",
  beides: "Web + Mobile",
  unsicher: "Noch unsicher",
};

const DESIGN_LABELS: Record<string, string> = {
  standard: "Standard",
  individuell: "Individuell",
  premium: "Premium",
};

const ZEITRAHMEN_MVP_LABELS: Record<string, string> = {
  "48h": "48 Stunden",
  "1-2wochen": "1-2 Wochen",
  "1monat": "1 Monat",
  flexibel: "Flexibel",
};

const ZEITRAHMEN_FINAL_LABELS: Record<string, string> = {
  "1monat": "1 Monat",
  "2-3monate": "2-3 Monate",
  "6monate": "6 Monate",
  laufend: "Laufend",
};

const BUDGET_LABELS: Record<string, string> = {
  "unter-399": "Unter 399 €",
  "399-1000": "399-1.000 €",
  "1000-5000": "1.000-5.000 €",
  "5000-10000": "5.000-10.000 €",
  "10000-plus": "Über 10.000 €",
  unsicher: "Noch unsicher",
};

const BETRIEB_LABELS: Record<string, string> = {
  ja: "Ja, inklusive",
  teilweise: "Teilweise",
  nein: "Nein",
  unsicher: "Noch unsicher",
  ohne: "Ohne",
};

const MONETARISIERUNG_LABELS: Record<string, string> = {
  werbung: "Werbung",
  abonnement: "Abonnement",
  "einmalige-zahlung": "Einmalige Zahlung",
  freemium: "Freemium",
  provisionen: "Provisionen",
  kostenlos: "Kostenlos",
  sonstiges: "Sonstiges",
};

const ROLLEN_LABELS: Record<string, string> = {
  "1": "1 Benutzergruppe",
  "2": "2 Benutzergruppen",
  "3+": "3+ Benutzergruppen",
};

function formatValue(field: string, value: unknown): string | string[] {
  if (field === "projekttyp" && typeof value === "string")
    return PROJEKTTYP_LABELS[value] || value;
  if (field === "designLevel" && typeof value === "string")
    return DESIGN_LABELS[value] || value;
  if (field === "zeitrahmenMvp" && typeof value === "string")
    return ZEITRAHMEN_MVP_LABELS[value] || value;
  if (field === "zeitrahmenFinal" && typeof value === "string")
    return ZEITRAHMEN_FINAL_LABELS[value] || value;
  if (field === "budget" && typeof value === "string")
    return BUDGET_LABELS[value] || value;
  if (field === "betriebUndWartung" && typeof value === "string")
    return BETRIEB_LABELS[value] || value;
  if (field === "rollenAnzahl" && typeof value === "string")
    return ROLLEN_LABELS[value] || value;
  if (field === "funktionen" && Array.isArray(value))
    return value as string[];
  if (field === "monetarisierung" && Array.isArray(value))
    return (value as string[]).map((v) => MONETARISIERUNG_LABELS[v] || v);
  if (typeof value === "string") return value;
  return String(value);
}

function ConfidenceBadge({
  level,
}: {
  level: "high" | "medium" | "low";
}) {
  const style = CONFIDENCE_STYLES[level];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${style.bg} ${style.color}`}
    >
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}

export function PdfExtractionReview({
  summary,
  extracted,
  confidence,
  missing,
  onConfirm,
  onRestart,
}: Props) {
  // Group extracted fields (skip undefined values)
  const extractedEntries = Object.entries(extracted).filter(
    ([, v]) => v !== undefined && v !== null
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-5">
        <h2 className="text-lg font-bold text-white mb-2">
          Analyse abgeschlossen
        </h2>
        <p className="text-sm text-[#c8cad0] leading-relaxed">{summary}</p>
      </div>

      {/* Extracted data */}
      {extractedEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#8B8F97] uppercase tracking-wider">
            Erkannte Angaben
          </h3>
          <div className="space-y-2">
            {extractedEntries.map(([field, value]) => {
              const formatted = formatValue(field, value);
              const conf = confidence[field] || "medium";

              return (
                <div
                  key={field}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs text-[#6a6e76] font-medium">
                      {FIELD_LABELS[field] || field}
                    </span>
                    <ConfidenceBadge level={conf} />
                  </div>
                  {Array.isArray(formatted) ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formatted.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="bg-white/[0.06] text-[#c8cad0] border-none text-xs"
                        >
                          {item.startsWith("custom:")
                            ? item.replace("custom:", "")
                            : (FEATURE_OPTIONS as readonly string[]).includes(item)
                              ? item
                              : item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white">{formatted}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missing fields notice */}
      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <p className="text-sm text-amber-400 font-medium mb-1">
            Folgende Angaben fehlen noch:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((field) => (
              <Badge
                key={field}
                variant="secondary"
                className="bg-amber-400/10 text-amber-400 border-none text-xs"
              >
                {FIELD_LABELS[field] || field}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 text-sm text-[#8B8F97] hover:text-white transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Nochmal hochladen
        </button>
        <Button
          onClick={onConfirm}
          className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD44D] font-medium px-6"
        >
          {missing.length > 0
            ? "Stimmt soweit — fehlende Angaben ergänzen"
            : "Stimmt soweit — weiter"}
        </Button>
      </div>
    </div>
  );
}
