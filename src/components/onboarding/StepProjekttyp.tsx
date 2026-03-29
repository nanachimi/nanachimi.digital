import type { OnboardingData } from "@/lib/onboarding-schema";
import { Globe, Smartphone, Layers, HelpCircle } from "lucide-react";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const options = [
  { value: "web", label: "Etwas im Browser", desc: "Erreichbar über jeden Browser — PC, Tablet oder Handy", icon: Globe },
  { value: "mobile", label: "Eine Handy-App", desc: "Für iPhone, Android oder beides", icon: Smartphone },
  { value: "beides", label: "Beides", desc: "Browser + Handy-App", icon: Layers },
  { value: "unsicher", label: "Ich bin mir noch unsicher", desc: "Kein Problem — wir helfen Ihnen bei der Entscheidung", icon: HelpCircle },
] as const;

export function StepProjekttyp({ data, onChange }: Props) {
  return (
    <div>
      <p className="text-sm text-[#8B8F97] mb-4">
        Damit wir wissen, wo Ihre Lösung zum Einsatz kommt.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = data.projekttyp === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ projekttyp: opt.value })}
              className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                selected
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                selected ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
              }`}>
                <opt.icon className={`h-5 w-5 ${selected ? "text-[#FFC62C]" : "text-[#8B8F97]"}`} />
              </div>
              <div>
                <p className={`font-semibold ${selected ? "text-[#FFC62C]" : "text-white"}`}>
                  {opt.label}
                </p>
                <p className="text-sm text-[#6a6e76]">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-[#6a6e76]">
        Keine technischen Kenntnisse nötig. Beschreiben Sie einfach, was Sie brauchen.
      </p>
    </div>
  );
}
