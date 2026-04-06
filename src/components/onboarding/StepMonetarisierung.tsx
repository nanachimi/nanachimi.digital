import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  RefreshCw,
  CreditCard,
  Gift,
  Percent,
  Heart,
  MoreHorizontal,
  Check,
} from "lucide-react";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const optionen = [
  {
    value: "werbung" as const,
    label: "Werbung",
    desc: "Verdienen durch Anzeigen oder Sponsored Content",
    icon: Megaphone,
  },
  {
    value: "abonnement" as const,
    label: "Abonnement / Mitgliedschaft",
    desc: "Regelmäßige Gebühren für Zugang oder Features",
    icon: RefreshCw,
  },
  {
    value: "einmalige-zahlung" as const,
    label: "Einmalige Zahlung",
    desc: "Kunden zahlen einmalig für Produkt oder Leistung",
    icon: CreditCard,
  },
  {
    value: "freemium" as const,
    label: "Freemium",
    desc: "Kostenlose Basis + bezahlte Premium-Features",
    icon: Gift,
  },
  {
    value: "provisionen" as const,
    label: "Provisionen / Marktplatz",
    desc: "Verdienen durch Transaktionsgebühren",
    icon: Percent,
  },
  {
    value: "kostenlos" as const,
    label: "Kostenloses Angebot",
    desc: "Ohne direktes Erlösmodell",
    icon: Heart,
  },
  {
    value: "sonstiges" as const,
    label: "Sonstiges",
    desc: "Anderes Modell",
    icon: MoreHorizontal,
  },
] as const;

const werZahltOptionen = [
  { value: "alle" as const, label: "Alle Nutzer" },
  { value: "bestimmte-gruppen" as const, label: "Nur bestimmte Gruppen" },
  { value: "unternehmen" as const, label: "Unternehmen / B2B" },
  { value: "unsicher" as const, label: "Noch unsicher" },
] as const;

function getRoleNames(data: Partial<OnboardingData>): string[] {
  if (data.rollenAnzahl === "1") return [];
  return (data.rollenApps || []).map((r) => r.rolle).filter(Boolean);
}

export function StepMonetarisierung({ data, onChange }: Props) {
  const selected = data.monetarisierung || [];
  const roleNames = getRoleNames(data);
  const hasMultipleRoles = roleNames.length > 0;

  function toggle(value: (typeof optionen)[number]["value"]) {
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange({ monetarisierung: updated });
  }

  function toggleZahlendeGruppe(gruppe: string) {
    const current = data.zahlendeGruppen || [];
    const updated = current.includes(gruppe)
      ? current.filter((g) => g !== gruppe)
      : [...current, gruppe];
    onChange({ zahlendeGruppen: updated });
  }

  function selectAllZahlendeGruppen() {
    const current = data.zahlendeGruppen || [];
    const allSelected = roleNames.every((r) => current.includes(r));
    onChange({ zahlendeGruppen: allSelected ? [] : [...roleNames] });
  }

  // Show "Wer zahlt?" only if a paid option is selected (not just "kostenlos")
  const hasPaidOption = selected.some((v) => v !== "kostenlos" && v !== "sonstiges");
  const showGruppenAuswahl = data.werZahlt === "bestimmte-gruppen" && hasMultipleRoles;

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#8B8F97]">
        Wie planen Sie, mit Ihrer Lösung Einnahmen zu erzielen? Mehrfachauswahl möglich.
      </p>

      {/* Multi-select options */}
      <div className="space-y-3">
        {optionen.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-start gap-4 w-full rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded mt-0.5 ${
                  isSelected
                    ? "bg-[#FFC62C]"
                    : "border border-white/20"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-[#111318]" />}
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isSelected ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
              }`}>
                <opt.icon className={`h-5 w-5 ${isSelected ? "text-[#FFC62C]" : "text-[#8B8F97]"}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${isSelected ? "text-[#FFC62C]" : "text-white"}`}>
                  {opt.label}
                </p>
                <p className="text-sm text-[#6a6e76] mt-0.5">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Wer zahlt? — only if paid option selected */}
      {hasPaidOption && (
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <Label className="text-[#c8cad0]">Wer zahlt?</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {werZahltOptionen.map((opt) => {
              const isSelected = data.werZahlt === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ werZahlt: opt.value })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
                    isSelected
                      ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08] text-[#FFC62C]"
                      : "border-white/[0.08] bg-white/[0.02] text-[#8B8F97] hover:border-white/20 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Group selection — when "bestimmte-gruppen" selected */}
          {showGruppenAuswahl && (
            <div className="space-y-2 pt-2">
              <Label className="text-[#c8cad0] text-sm">Welche Gruppen zahlen?</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllZahlendeGruppen}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    roleNames.every((r) => (data.zahlendeGruppen || []).includes(r))
                      ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.15] text-[#FFC62C]"
                      : "border-white/10 bg-white/[0.02] text-[#8B8F97] hover:border-white/20"
                  }`}
                >
                  Alle
                </button>
                {roleNames.map((rolle) => {
                  const isActive = (data.zahlendeGruppen || []).includes(rolle);
                  return (
                    <button
                      key={rolle}
                      type="button"
                      onClick={() => toggleZahlendeGruppe(rolle)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                        isActive
                          ? "border-[#FFC62C]/40 bg-[#FFC62C]/[0.1] text-[#FFC62C]"
                          : "border-white/10 bg-white/[0.02] text-[#6a6e76] hover:border-white/20"
                      }`}
                    >
                      {rolle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional details */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[#c8cad0] text-sm">
            Weitere Details (optional)
          </Label>
          <Textarea
            value={data.monetarisierungDetails || ""}
            onChange={(e) => onChange({ monetarisierungDetails: e.target.value })}
            placeholder="z.B. 9,99 €/Monat geplant, Freemium mit 3 Preisstufen…"
            rows={3}
            maxLength={500}
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none text-sm"
          />
        </div>
      )}
    </div>
  );
}
