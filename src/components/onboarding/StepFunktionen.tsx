"use client";

import { useState } from "react";
import {
  FEATURE_OPTIONS,
  CUSTOM_FEATURE_PREFIX,
  MAX_CUSTOM_FEATURES,
  MAX_CUSTOM_FEATURE_LENGTH,
} from "@/lib/onboarding-schema";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { Check, Plus, X } from "lucide-react";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepFunktionen({ data, onChange }: Props) {
  const selected = data.funktionen || [];
  const [customInput, setCustomInput] = useState("");

  // Split selected into predefined and custom
  const customFeatures = selected.filter((f) =>
    f.startsWith(CUSTOM_FEATURE_PREFIX)
  );
  const customCount = customFeatures.length;
  const canAddMore = customCount < MAX_CUSTOM_FEATURES;

  function toggle(feature: string) {
    const next = selected.includes(feature)
      ? selected.filter((f) => f !== feature)
      : [...selected, feature];
    onChange({ funktionen: next });
  }

  function addCustomFeature() {
    const trimmed = customInput.trim();
    if (!trimmed || !canAddMore) return;
    const prefixed = CUSTOM_FEATURE_PREFIX + trimmed;
    if (selected.includes(prefixed)) return; // no duplicates
    onChange({ funktionen: [...selected, prefixed] });
    setCustomInput("");
  }

  function removeCustomFeature(feature: string) {
    onChange({ funktionen: selected.filter((f) => f !== feature) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomFeature();
    }
  }

  return (
    <div>
      <p className="text-sm text-[#8B8F97] mb-4">
        Welche Möglichkeiten brauchen Sie? Wählen Sie alles Passende aus.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {FEATURE_OPTIONS.map((feature) => {
          const isSelected = selected.includes(feature);
          return (
            <button
              key={feature}
              type="button"
              onClick={() => toggle(feature)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                isSelected
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08] text-[#FFC62C]"
                  : "border-white/[0.08] bg-white/[0.02] text-[#c8cad0] hover:border-white/20"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                  isSelected
                    ? "bg-[#FFC62C] text-[#111318]"
                    : "border border-white/20"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              {feature}
            </button>
          );
        })}
      </div>

      {/* ── Custom Features Section ──────────────────────────── */}
      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <p className="text-sm font-medium text-[#c8cad0] mb-1">
          Eigene Funktionen hinzufügen
        </p>
        <p className="text-xs text-[#6a6e76] mb-3">
          Bis zu {MAX_CUSTOM_FEATURES} eigene Funktionen, je max.{" "}
          {MAX_CUSTOM_FEATURE_LENGTH} Zeichen.
        </p>

        {/* Custom feature chips */}
        {customFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customFeatures.map((f) => {
              const label = f.slice(CUSTOM_FEATURE_PREFIX.length);
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#FFC62C]/30 bg-[#FFC62C]/[0.08] px-3 py-1.5 text-sm text-[#FFC62C]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeCustomFeature(f)}
                    className="rounded-full p-0.5 hover:bg-[#FFC62C]/20 transition-colors"
                    aria-label={`${label} entfernen`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Input row */}
        {canAddMore && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) =>
                  setCustomInput(e.target.value.slice(0, MAX_CUSTOM_FEATURE_LENGTH))
                }
                onKeyDown={handleKeyDown}
                placeholder="z.B. Kalender-Integration"
                maxLength={MAX_CUSTOM_FEATURE_LENGTH}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 focus:outline-none focus:ring-1 focus:ring-[#FFC62C]/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#6a6e76]">
                {customInput.length}/{MAX_CUSTOM_FEATURE_LENGTH}
              </span>
            </div>
            <button
              type="button"
              onClick={addCustomFeature}
              disabled={!customInput.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-[#FFC62C]/30 bg-[#FFC62C]/[0.06] px-4 py-2.5 text-sm font-medium text-[#FFC62C] transition-all hover:bg-[#FFC62C]/[0.12] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Hinzufügen
            </button>
          </div>
        )}

        {!canAddMore && (
          <p className="text-xs text-[#FFC62C]/70">
            Maximum von {MAX_CUSTOM_FEATURES} eigenen Funktionen erreicht.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-[#6a6e76]">
        Nicht sicher, was Sie brauchen? Kein Problem — wir beraten Sie gerne.
      </p>
    </div>
  );
}
