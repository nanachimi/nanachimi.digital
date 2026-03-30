"use client";

import { useState } from "react";
import { Headphones, Check, Shield, Clock, Wrench } from "lucide-react";
import { BETRIEB_UND_WARTUNG } from "@/lib/constants";
import { AngebotActions } from "./AngebotActions";

interface Props {
  id: string;
  festpreis: number;
  aufwand: number;
  initialStatus: "idle" | "accepted";
  betriebUndWartung?: string; // from submission: "ja" | "teilweise" | "nein" | "unsicher"
}

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
});

const BW_BENEFITS = [
  { icon: Shield, text: "Monitoring & Sicherheitsupdates" },
  { icon: Wrench, text: "Bugfixes & Fehlerbehebung" },
  { icon: Clock, text: "Reaktionszeit unter 24h" },
];

export function AngebotPricing({
  id,
  festpreis,
  aufwand,
  initialStatus,
  betriebUndWartung,
}: Props) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  // Calculate total with selected package
  const packageCost = selectedPackage
    ? BETRIEB_UND_WARTUNG.pakete.find((p) => p.monate === selectedPackage)!
        .preisProMonat * selectedPackage
    : 0;
  const totalPrice = festpreis + packageCost;

  const showBetreuungPicker =
    initialStatus === "idle" ||
    (initialStatus === "accepted" && !selectedPackage);

  return (
    <>
      {/* Festpreis — updates dynamically */}
      <div className="rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.05] p-8 text-center mb-8">
        <p className="text-sm text-[#8B8F97] mb-2">Festpreis</p>
        <p className="text-4xl font-black text-white md:text-5xl">
          {formatter.format(totalPrice)}
        </p>
        <p className="mt-2 text-sm text-[#8B8F97]">
          Aufwand: {aufwand} Personentage
        </p>
        {packageCost > 0 && (
          <p className="mt-1 text-xs text-[#FFC62C]">
            inkl. {selectedPackage} Monate Betreuung (
            {formatter.format(packageCost)})
          </p>
        )}
      </div>

      {/* Betreuung nach dem Start — selectable packages */}
      {showBetreuungPicker && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Headphones className="h-5 w-5 text-[#FFC62C]" />
            Betreuung nach dem Start
          </h2>

          {/* Included info */}
          <div className="rounded-lg bg-emerald-400/[0.06] border border-emerald-400/15 p-3 mb-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">
                <span className="font-medium">1 Monat</span> Betreuung ist
                bereits im Festpreis enthalten
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {BW_BENEFITS.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] p-2.5 text-center"
              >
                <Icon className="h-4 w-4 text-[#FFC62C]" />
                <span className="text-[10px] text-[#8B8F97] leading-tight">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm text-[#8B8F97] mb-4">
            Sorgenfrei weiterarbeiten? Wählen Sie ein Betreuungspaket — der
            Betrag wird automatisch zum Festpreis addiert.
          </p>

          {/* Package selector */}
          <div className="space-y-2.5">
            {/* No package option */}
            <button
              type="button"
              onClick={() => setSelectedPackage(null)}
              className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                selectedPackage === null
                  ? "border-white/20 bg-white/[0.04]"
                  : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === null
                      ? "border-white bg-white"
                      : "border-[#6a6e76]"
                  }`}
                >
                  {selectedPackage === null && (
                    <div className="h-2 w-2 rounded-full bg-[#111318]" />
                  )}
                </div>
                <span className="text-sm text-white">
                  Kein Paket — nur der inkludierte Monat
                </span>
              </div>
              <span className="text-sm text-[#8B8F97]">+0 €</span>
            </button>

            {/* Packages */}
            {BETRIEB_UND_WARTUNG.pakete.map((paket) => {
              const isSelected = selectedPackage === paket.monate;
              const totalPaketCost = paket.preisProMonat * paket.monate;
              const isPopular = paket.monate === 6;

              return (
                <button
                  key={paket.monate}
                  type="button"
                  onClick={() =>
                    setSelectedPackage(isSelected ? null : paket.monate)
                  }
                  className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-[#FFC62C]/40 bg-[#FFC62C]/[0.06]"
                      : "border-white/[0.06] bg-white/[0.01] hover:border-white/15"
                  } ${isPopular && !isSelected ? "border-[#FFC62C]/15" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-[#FFC62C] bg-[#FFC62C]"
                          : "border-[#6a6e76]"
                      }`}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-[#111318]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${isSelected ? "text-[#FFC62C]" : "text-white"}`}
                        >
                          {paket.label}
                        </span>
                        {isPopular && (
                          <span className="text-[10px] font-bold text-[#FFC62C] bg-[#FFC62C]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Beliebt
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8B8F97]">
                        {formatter.format(paket.preisProMonat)}/Monat
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${isSelected ? "text-[#FFC62C]" : "text-white"}`}
                  >
                    +{formatter.format(totalPaketCost)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedPackage && (
            <div className="mt-4 rounded-lg bg-[#FFC62C]/[0.04] border border-[#FFC62C]/10 p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#c0c3c9]">
                  Neuer Gesamtpreis
                </span>
                <div className="text-right">
                  <span className="text-[#FFC62C] font-bold text-lg">
                    {formatter.format(totalPrice)}
                  </span>
                  <span className="text-[#6a6e76] text-xs ml-2">
                    ({formatter.format(festpreis)} +{" "}
                    {formatter.format(packageCost)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accept / Reject / Payment — uses totalPrice */}
      <AngebotActions
        id={id}
        initialStatus={initialStatus}
        festpreis={totalPrice}
        betreuungMonate={selectedPackage ?? undefined}
      />
    </>
  );
}
