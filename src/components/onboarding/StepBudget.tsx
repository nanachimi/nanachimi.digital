import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const options = [
  { value: "unter-399" as const, label: "Unter 399 €", desc: "Kleine Projekte & erste Schritte" },
  { value: "399-1000" as const, label: "399 – 1.000 €", desc: "Standard-Projekte" },
  { value: "1000-5000" as const, label: "1.000 – 5.000 €", desc: "Umfangreichere Lösungen" },
  { value: "5000-10000" as const, label: "5.000 – 10.000 €", desc: "Große Projekte" },
  { value: "10000-plus" as const, label: "Über 10.000 €", desc: "Komplexe Lösungen" },
  { value: "unsicher" as const, label: "Noch unsicher", desc: "Wir helfen Ihnen bei der Einschätzung" },
];

export function StepBudget({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8B8F97] mb-4">
        Nur zur Orientierung — wir passen das Angebot an Ihr Budget an.
      </p>
      {options.map((opt) => {
        const selected = data.budget === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ budget: opt.value })}
            className={`flex items-center justify-between w-full rounded-xl border px-5 py-4 text-left transition-all ${
              selected
                ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div>
              <p className={`font-semibold ${selected ? "text-[#FFC62C]" : "text-white"}`}>
                {opt.label}
              </p>
              <p className="text-sm text-[#6a6e76]">{opt.desc}</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              selected ? "border-[#FFC62C]" : "border-white/20"
            }`}>
              {selected && <div className="h-2.5 w-2.5 rounded-full bg-[#FFC62C]" />}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-[#6a6e76] mt-2">
        Es gibt keine falschen Antworten — wir finden die beste Lösung für Ihr Budget.
      </p>
    </div>
  );
}
