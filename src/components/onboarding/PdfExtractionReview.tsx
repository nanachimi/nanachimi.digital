"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, RotateCcw, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { FEATURE_OPTIONS } from "@/lib/onboarding-schema";

interface Props {
  summary: string;
  extracted: Partial<OnboardingData>;
  confidence: Record<string, "high" | "medium" | "low">;
  missing: string[];
  onChange: (partial: Partial<OnboardingData>) => void;
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

const APP_STRUKTUR_LABELS: Record<string, string> = {
  shared: "Gemeinsame Anwendung",
  separate: "Getrennte Anwendungen",
};

// Which fields use a select dropdown
const SELECT_FIELDS: Record<string, Record<string, string>> = {
  projekttyp: PROJEKTTYP_LABELS,
  designLevel: DESIGN_LABELS,
  zeitrahmenMvp: ZEITRAHMEN_MVP_LABELS,
  zeitrahmenFinal: ZEITRAHMEN_FINAL_LABELS,
  budget: BUDGET_LABELS,
  betriebUndWartung: BETRIEB_LABELS,
  rollenAnzahl: ROLLEN_LABELS,
  appStruktur: APP_STRUKTUR_LABELS,
};

// Which fields use a multi-select (checkbox list)
const MULTI_SELECT_FIELDS: Record<string, Record<string, string>> = {
  monetarisierung: MONETARISIERUNG_LABELS,
};

// Which fields use a textarea
const TEXTAREA_FIELDS = new Set(["beschreibung", "rollenBeschreibung", "brandingInfo", "zielgruppe"]);

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
  if (field === "appStruktur" && typeof value === "string")
    return APP_STRUKTUR_LABELS[value] || value;
  if (field === "funktionen" && Array.isArray(value))
    return value as string[];
  if (field === "monetarisierung" && Array.isArray(value))
    return (value as string[]).map((v) => MONETARISIERUNG_LABELS[v] || v);
  if (typeof value === "string") return value;
  return String(value);
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const style = CONFIDENCE_STYLES[level];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${style.bg} ${style.color}`}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}

function SelectEditor({ field, value, onSave, onCancel }: {
  field: string;
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(value);
  const options = SELECT_FIELDS[field];
  return (
    <div className="space-y-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#FFC62C]/40 focus:outline-none"
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key} className="bg-[#1a1d24]">{label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave(selected)} className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
          <Check className="h-3 w-3" /> Speichern
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-[#8B8F97] hover:text-white">
          <X className="h-3 w-3" /> Abbrechen
        </button>
      </div>
    </div>
  );
}

function MultiSelectEditor({ field, value, onSave, onCancel }: {
  field: string;
  value: string[];
  onSave: (val: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(value);
  const options = field === "funktionen"
    ? Object.fromEntries(FEATURE_OPTIONS.map((f) => [f, f]))
    : MULTI_SELECT_FIELDS[field];

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selected.includes(key)
                ? "bg-[#FFC62C]/20 text-[#FFC62C] border-[#FFC62C]/30"
                : "bg-white/[0.04] text-[#8B8F97] border-white/[0.08] hover:bg-white/[0.06]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave(selected)} className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
          <Check className="h-3 w-3" /> Speichern
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-[#8B8F97] hover:text-white">
          <X className="h-3 w-3" /> Abbrechen
        </button>
      </div>
    </div>
  );
}

function TextEditor({ value, multiline, onSave, onCancel }: {
  value: string;
  multiline: boolean;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  const inputClasses = "w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#FFC62C]/40 focus:outline-none";
  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className={inputClasses + " resize-y"}
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={inputClasses}
        />
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave(text)} className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
          <Check className="h-3 w-3" /> Speichern
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-[#8B8F97] hover:text-white">
          <X className="h-3 w-3" /> Abbrechen
        </button>
      </div>
    </div>
  );
}

export function PdfExtractionReview({
  summary,
  extracted,
  confidence,
  missing,
  onChange,
  onConfirm,
  onRestart,
}: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);

  const extractedEntries = Object.entries(extracted).filter(
    ([, v]) => v !== undefined && v !== null
  );

  function handleSave(field: string, value: unknown) {
    onChange({ [field]: value } as Partial<OnboardingData>);
    setEditingField(null);
  }

  function renderEditor(field: string, value: unknown) {
    if (SELECT_FIELDS[field]) {
      return (
        <SelectEditor
          field={field}
          value={String(value)}
          onSave={(val) => handleSave(field, val)}
          onCancel={() => setEditingField(null)}
        />
      );
    }
    if (MULTI_SELECT_FIELDS[field] || field === "funktionen") {
      return (
        <MultiSelectEditor
          field={field}
          value={Array.isArray(value) ? value : []}
          onSave={(val) => handleSave(field, val)}
          onCancel={() => setEditingField(null)}
        />
      );
    }
    if (TEXTAREA_FIELDS.has(field)) {
      return (
        <TextEditor
          value={String(value || "")}
          multiline
          onSave={(val) => handleSave(field, val)}
          onCancel={() => setEditingField(null)}
        />
      );
    }
    // Default: text input
    return (
      <TextEditor
        value={String(value || "")}
        multiline={false}
        onSave={(val) => handleSave(field, val)}
        onCancel={() => setEditingField(null)}
      />
    );
  }

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
              const isEditing = editingField === field;

              return (
                <div
                  key={field}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs text-[#6a6e76] font-medium">
                      {FIELD_LABELS[field] || field}
                    </span>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge level={conf} />
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingField(field)}
                          className="text-[#8B8F97] hover:text-[#FFC62C] transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    renderEditor(field, value)
                  ) : Array.isArray(formatted) ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formatted.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="bg-white/[0.06] text-[#c8cad0] border-none text-xs"
                        >
                          {item.startsWith("custom:")
                            ? item.replace("custom:", "")
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
