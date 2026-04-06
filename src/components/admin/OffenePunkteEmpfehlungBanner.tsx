"use client";

import type { OffenerPunkt } from "@/lib/plan-template";
import {
  getOffenePunkteEmpfehlung,
  EMPFEHLUNG_CONFIG,
} from "@/lib/offene-punkte-utils";

interface OffenePunkteEmpfehlungBannerProps {
  offenePunkte: OffenerPunkt[];
}

const TYP_LABELS: Record<string, string> = {
  luecke: "Lücke",
  inkonsistenz: "Inkonsistenz",
  risiko: "Risiko",
  unklarheit: "Unklarheit",
};

export function OffenePunkteEmpfehlungBanner({
  offenePunkte,
}: OffenePunkteEmpfehlungBannerProps) {
  if (!offenePunkte || offenePunkte.length === 0) return null;

  const empfehlung = getOffenePunkteEmpfehlung(offenePunkte);
  const config = EMPFEHLUNG_CONFIG[empfehlung];

  // Count by type
  const counts = offenePunkte.reduce(
    (acc, p) => {
      acc[p.typ] = (acc[p.typ] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const countSummary = Object.entries(counts)
    .map(([typ, count]) => `${count}× ${TYP_LABELS[typ] || typ}`)
    .join(", ");

  return (
    <div
      className={`rounded-xl border ${config.borderClass} ${config.bgClass} p-4 mb-4`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl ${config.iconClass} shrink-0 mt-0.5`}>
          {config.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-sm ${config.textClass}`}>
            {config.label}
          </p>
          <p className="text-xs text-[#8B8F97] mt-1">{config.beschreibung}</p>
          <p className="text-xs text-[#6a6e76] mt-2">{countSummary}</p>
        </div>
      </div>
    </div>
  );
}
