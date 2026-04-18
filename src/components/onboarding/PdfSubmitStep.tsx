"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { StepKontaktdaten } from "./StepKontaktdaten";
import { StepAbschluss } from "./StepAbschluss";

interface EstimateResult {
  range: { untergrenze: number; obergrenze: number };
  aufwand: number;
  riskLevel: "low" | "medium" | "high";
  slaMinutes: number;
  bwInfo: {
    includedMonths: number;
    packages: { months: number; pricePerMonth: number }[];
    customerWants: boolean;
  };
}

interface Props {
  data: Partial<OnboardingData>;
  onChange: (partial: Partial<OnboardingData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function PdfSubmitStep({
  data,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
}: Props) {
  const [estimate, setEstimate] = useState<EstimateResult | undefined>();
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [subStep, setSubStep] = useState<"contact" | "final">("contact");

  // Contact form validity
  const isContactValid =
    !!data.name &&
    data.name.trim().length >= 2 &&
    !!data.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

  // Final form validity
  const isSubmitReady = isContactValid && !!data.naechsterSchritt;

  // Fetch estimate when entering the final step
  useEffect(() => {
    if (subStep !== "final" || estimate) return;

    setEstimateLoading(true);
    fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projekttyp: data.projekttyp,
        funktionen: data.funktionen,
        rollenAnzahl: data.rollenAnzahl,
        designLevel: data.designLevel,
        zeitrahmenMvp: data.zeitrahmenMvp,
        zeitrahmenFinal: data.zeitrahmenFinal,
        budget: data.budget,
        betriebUndWartung: data.betriebUndWartung,
        appStruktur: data.appStruktur,
        rollenApps: data.rollenApps,
      }),
    })
      .then((res) => res.json())
      .then((result) => setEstimate(result))
      .catch(() => {
        // Estimate is optional — continue without it
      })
      .finally(() => setEstimateLoading(false));
  }, [subStep, data, estimate]);

  if (subStep === "contact") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Ihre Kontaktdaten</h2>
          <p className="mt-2 text-sm text-[#8B8F97]">
            Damit wir Ihnen Ihre persönliche Einschätzung schicken können.
          </p>
        </div>

        <StepKontaktdaten data={data} onChange={onChange} />

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#8B8F97] hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <Button
            onClick={() => setSubStep("final")}
            disabled={!isContactValid}
            className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD44D] font-medium px-6 disabled:opacity-50"
          >
            Weiter zur Einschätzung
          </Button>
        </div>
      </div>
    );
  }

  // Final step: estimate + naechsterSchritt + submit
  return (
    <div className="space-y-6">
      {estimateLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-[#8B8F97] animate-pulse">
            Einschätzung wird berechnet...
          </p>
        </div>
      )}

      <StepAbschluss data={data} onChange={onChange} estimate={estimate} />

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => setSubStep("contact")}
          className="text-[#8B8F97] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isSubmitReady || isSubmitting}
          className="bg-[#FFC62C] text-[#111318] hover:bg-[#FFD44D] font-medium px-8 disabled:opacity-50"
        >
          {isSubmitting ? "Wird gesendet..." : "Absenden"}
        </Button>
      </div>
    </div>
  );
}
