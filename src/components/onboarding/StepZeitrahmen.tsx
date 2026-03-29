import type { OnboardingData } from "@/lib/onboarding-schema";
import { Zap, Clock, CalendarDays, Infinity } from "lucide-react";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const mvpOptions = [
  { value: "48h", label: "So schnell wie möglich", desc: "In 48 Stunden möglich bei klarem Umfang", icon: Zap },
  { value: "1-2wochen", label: "In 1–2 Wochen", desc: "Der häufigste Zeitrahmen", icon: Clock },
  { value: "1monat", label: "In einem Monat", desc: "Mehr Zeit für Details", icon: CalendarDays },
  { value: "flexibel", label: "Kein fester Termin", desc: "Wir finden gemeinsam den richtigen Zeitpunkt", icon: Infinity },
] as const;

const finalOptions = [
  { value: "1monat", label: "1 Monat", desc: "Schnelle Weiterentwicklung nach der ersten Version" },
  { value: "2-3monate", label: "2–3 Monate", desc: "Solider Ausbau" },
  { value: "6monate", label: "6 Monate", desc: "Umfangreiche Weiterentwicklung" },
  { value: "laufend", label: "Laufend", desc: "Kontinuierliche Verbesserung" },
] as const;

function OptionCard({
  selected,
  label,
  desc,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  desc: string;
  icon?: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
      }`}
    >
      {Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${selected ? "text-[#FFC62C]" : "text-[#8B8F97]"}`}
          />
        </div>
      )}
      {!Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
          }`}
        >
          <CalendarDays
            className={`h-4 w-4 ${selected ? "text-[#FFC62C]" : "text-[#8B8F97]"}`}
          />
        </div>
      )}
      <div>
        <p
          className={`font-semibold text-sm ${selected ? "text-[#FFC62C]" : "text-white"}`}
        >
          {label}
        </p>
        <p className="text-xs text-[#6a6e76]">{desc}</p>
      </div>
    </button>
  );
}

export function StepZeitrahmen({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      {/* MVP Delivery */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">
          Wann brauchen Sie die erste Version?
        </h3>
        <p className="text-sm text-[#8B8F97] mb-4">
          Die erste Version enthält die wichtigsten Funktionen — wir bauen danach weiter aus.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {mvpOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={data.zeitrahmenMvp === opt.value}
              label={opt.label}
              desc={opt.desc}
              icon={opt.icon}
              onClick={() => onChange({ zeitrahmenMvp: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Final Delivery */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">
          Und die fertige Version?
        </h3>
        <p className="text-sm text-[#8B8F97] mb-4">
          Das vollständige Produkt mit allen Funktionen.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {finalOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={data.zeitrahmenFinal === opt.value}
              label={opt.label}
              desc={opt.desc}
              onClick={() => onChange({ zeitrahmenFinal: opt.value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
