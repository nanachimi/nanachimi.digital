"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

interface Props {
  filename: string;
}

const PROGRESS_STEPS = [
  { label: "PDF wird gelesen...", delay: 0 },
  { label: "Inhalte werden analysiert...", delay: 2000 },
  { label: "Anforderungen werden extrahiert...", delay: 5000 },
  { label: "Ergebnis wird aufbereitet...", delay: 10000 },
];

export function PdfAnalysisLoading({ filename }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    for (let i = 1; i < PROGRESS_STEPS.length; i++) {
      timers.push(
        setTimeout(() => setCurrentStep(i), PROGRESS_STEPS[i].delay)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Animated icon */}
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-[#FFC62C]/10 flex items-center justify-center">
          <FileText className="h-10 w-10 text-[#FFC62C]" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#111318] flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-[#FFC62C] animate-spin" />
        </div>
      </div>

      {/* File name */}
      <p className="text-sm text-[#6a6e76] font-mono truncate max-w-xs">
        {filename}
      </p>

      {/* Progress steps */}
      <div className="space-y-3 w-full max-w-xs">
        {PROGRESS_STEPS.map((step, i) => (
          <div
            key={step.label}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i <= currentStep
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                i < currentStep
                  ? "bg-[#FFC62C]"
                  : i === currentStep
                    ? "bg-[#FFC62C] animate-pulse"
                    : "bg-white/10"
              }`}
            />
            <span
              className={`text-sm transition-colors duration-500 ${
                i === currentStep
                  ? "text-white font-medium"
                  : i < currentStep
                    ? "text-[#8B8F97]"
                    : "text-[#6a6e76]"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Time estimate */}
      <p className="text-xs text-[#6a6e76]">
        Dies dauert in der Regel 10-20 Sekunden
      </p>
    </div>
  );
}
