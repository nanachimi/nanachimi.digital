"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { groupMissingFields } from "@/lib/pdf-analysis";
import { StepProjekttyp } from "./StepProjekttyp";
import { StepBeschreibung } from "./StepBeschreibung";
import { StepFunktionen } from "./StepFunktionen";
import { StepNutzerrollen } from "./StepNutzerrollen";
import { StepDesign } from "./StepDesign";
import { StepZeitrahmen } from "./StepZeitrahmen";
import { StepBudget } from "./StepBudget";
import { StepBetrieb } from "./StepBetrieb";
import { StepMonetarisierung } from "./StepMonetarisierung";

interface Props {
  missing: string[];
  data: Partial<OnboardingData>;
  onChange: (partial: Partial<OnboardingData>) => void;
  onComplete: () => void;
  onBack: () => void;
}

// Map group keys to their Step components and titles
const STEP_MAP: Record<
  string,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<{ data: Partial<OnboardingData>; onChange: (d: Partial<OnboardingData>) => void }>;
    title: string;
  }
> = {
  projekttyp: { component: StepProjekttyp, title: "Welche Art von Lösung?" },
  beschreibung: { component: StepBeschreibung, title: "Projektbeschreibung" },
  funktionen: { component: StepFunktionen, title: "Welche Funktionen?" },
  rollenAnzahl: { component: StepNutzerrollen, title: "Benutzergruppen" },
  designLevel: { component: StepDesign, title: "Design-Level" },
  zeitrahmen: { component: StepZeitrahmen, title: "Zeitrahmen" },
  budget: { component: StepBudget, title: "Budget" },
  betriebUndWartung: { component: StepBetrieb, title: "Betrieb & Wartung" },
  monetarisierung: {
    component: StepMonetarisierung,
    title: "Monetarisierung",
  },
};

// Validation: check if a group's required fields are filled
function isGroupComplete(
  group: string,
  data: Partial<OnboardingData>
): boolean {
  switch (group) {
    case "projekttyp":
      return !!data.projekttyp;
    case "beschreibung":
      return !!data.beschreibung && data.beschreibung.length >= 10;
    case "funktionen":
      return !!data.funktionen && data.funktionen.length > 0;
    case "rollenAnzahl":
      return !!data.rollenAnzahl;
    case "designLevel":
      return !!data.designLevel;
    case "zeitrahmen":
      return !!data.zeitrahmenMvp && !!data.zeitrahmenFinal;
    case "budget":
      return !!data.budget;
    case "betriebUndWartung":
      return !!data.betriebUndWartung;
    case "monetarisierung":
      return !!data.monetarisierung && data.monetarisierung.length > 0;
    default:
      return true;
  }
}

export function PdfFollowUpForm({
  missing,
  data,
  onChange,
  onComplete,
  onBack,
}: Props) {
  const groups = useMemo(() => groupMissingFields(missing), [missing]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // For ≤3 groups, show all stacked. For 4+, show one at a time.
  const useWizard = groups.length > 3;

  const handleNext = () => {
    if (currentIndex < groups.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      onBack();
    }
  };

  // Check if all groups are complete (for stacked mode)
  const allComplete = groups.every((g) => isGroupComplete(g, data));

  // Stacked mode (≤3 groups)
  if (!useWizard) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            Nur noch ein paar Fragen
          </h2>
          <p className="mt-2 text-sm text-[#8B8F97]">
            Folgende Angaben konnten wir nicht aus Ihrem PDF ableiten.
          </p>
        </div>

        {groups.map((group) => {
          const stepInfo = STEP_MAP[group];
          if (!stepInfo) return null;
          const StepComponent = stepInfo.component;

          return (
            <div
              key={group}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <h3 className="text-sm font-medium text-[#FFC62C] mb-4">
                {stepInfo.title}
              </h3>
              <StepComponent data={data} onChange={onChange} />
            </div>
          );
        })}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[#8B8F97] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <Button
            onClick={onComplete}
            disabled={!allComplete}
            className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD44D] font-medium px-6 disabled:opacity-50"
          >
            Weiter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Wizard mode (4+ groups)
  const currentGroup = groups[currentIndex];
  const stepInfo = STEP_MAP[currentGroup];
  if (!stepInfo) return null;
  const StepComponent = stepInfo.component;
  const isCurrentComplete = isGroupComplete(currentGroup, data);
  const isLast = currentIndex === groups.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#6a6e76]">
          <span>
            Frage {currentIndex + 1} von {groups.length}
          </span>
          <span>{stepInfo.title}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[#FFC62C] transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / groups.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current step */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-sm font-medium text-[#FFC62C] mb-4">
          {stepInfo.title}
        </h3>
        <StepComponent data={data} onChange={onChange} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-[#8B8F97] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isCurrentComplete}
          className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD44D] font-medium px-6 disabled:opacity-50"
        >
          {isLast ? "Weiter zur Einschätzung" : "Nächste Frage"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
