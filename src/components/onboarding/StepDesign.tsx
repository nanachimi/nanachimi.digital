import type { OnboardingData } from "@/lib/onboarding-schema";
import { Palette, Paintbrush, Gem } from "lucide-react";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const options = [
  {
    value: "standard" as const,
    label: "Sauber & funktional",
    desc: "Bewährtes Design, schnell einsatzbereit",
    icon: Palette,
    price: "Günstigste Option",
  },
  {
    value: "individuell" as const,
    label: "Nach meinen Vorgaben",
    desc: "Eigene Farben, Logo und Stil",
    icon: Paintbrush,
    price: "Mittlere Option",
  },
  {
    value: "premium" as const,
    label: "Besonders hochwertig",
    desc: "Individuelles Design mit Animationen und Details",
    icon: Gem,
    price: "Premium-Option",
  },
];

export function StepDesign({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8B8F97] mb-4">
        Wir gestalten alles für Sie — Sie müssen nur die Richtung vorgeben.
      </p>
      {options.map((opt) => {
        const selected = data.designLevel === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ designLevel: opt.value })}
            className={`flex items-start gap-4 w-full rounded-xl border p-5 text-left transition-all ${
              selected
                ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              selected ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
            }`}>
              <opt.icon className={`h-5 w-5 ${selected ? "text-[#FFC62C]" : "text-[#8B8F97]"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`font-semibold ${selected ? "text-[#FFC62C]" : "text-white"}`}>
                  {opt.label}
                </p>
                <span className="text-xs text-[#6a6e76]">{opt.price}</span>
              </div>
              <p className="text-sm text-[#6a6e76] mt-1">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
