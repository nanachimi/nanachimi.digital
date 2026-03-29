import type { OnboardingData } from "@/lib/onboarding-schema";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { BETRIEB_UND_WARTUNG } from "@/lib/constants";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepBetrieb({ data, onChange }: Props) {
  const wantsSupport = data.betriebUndWartung === "ja";
  const declines = data.betriebUndWartung === "nein";
  const noSupport = data.betriebUndWartung === "ohne";

  return (
    <div>
      <p className="text-sm text-[#8B8F97] mb-6">
        Im Festpreis ist <span className="text-white font-medium">1 Monat Betrieb &amp; Wartung</span> nach
        dem Start enthalten (Monitoring, Updates, Bugfixes). Möchten Sie den Support danach verlängern?
      </p>

      <div className="space-y-3">
        {/* Option: Ja, verlängern */}
        <button
          type="button"
          onClick={() => onChange({ betriebUndWartung: "ja", betriebLaufzeit: data.betriebLaufzeit || "12" })}
          className={`flex items-start gap-4 w-full rounded-xl border p-5 text-left transition-all ${
            wantsSupport
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              wantsSupport ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 ${wantsSupport ? "text-[#FFC62C]" : "text-[#8B8F97]"}`}
            />
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${wantsSupport ? "text-[#FFC62C]" : "text-white"}`}>
              Ja, Support verlängern
            </p>
            <p className="text-sm text-[#6a6e76] mt-0.5">
              Wir kümmern uns weiterhin um alles: Technik, Sicherheit, Updates — rund um die Uhr.
            </p>
          </div>
        </button>

        {/* Sub-options: Duration selector — order: 6, 12 (recommended), 3 */}
        {wantsSupport && (
          <div className="ml-14 grid grid-cols-3 gap-2">
            {[
              BETRIEB_UND_WARTUNG.pakete[1], // 6 Monate
              BETRIEB_UND_WARTUNG.pakete[2], // 12 Monate (recommended, center)
              BETRIEB_UND_WARTUNG.pakete[0], // 3 Monate
            ].map((paket) => {
              const selected = data.betriebLaufzeit === String(paket.monate);
              const isRecommended = paket.monate === 12;
              return (
                <button
                  key={paket.monate}
                  type="button"
                  onClick={() =>
                    onChange({ betriebLaufzeit: String(paket.monate) as "3" | "6" | "12" })
                  }
                  className={`relative rounded-lg border p-3 text-center transition-all ${
                    selected
                      ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                      : isRecommended
                        ? "border-[#FFC62C]/30 bg-[#FFC62C]/[0.04] hover:border-[#FFC62C]/40"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FFC62C] px-2 py-0.5 text-[9px] font-bold text-[#111318] uppercase tracking-wider">
                      Empfohlen
                    </span>
                  )}
                  <p className={`text-sm font-semibold ${selected ? "text-[#FFC62C]" : "text-white"}`}>
                    {paket.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${selected ? "text-[#FFC62C]/70" : "text-[#6a6e76]"}`}>
                    {paket.preisProMonat} €/Monat
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Option: Nein, nur den inkludierten Monat */}
        <button
          type="button"
          onClick={() => onChange({ betriebUndWartung: "nein", betriebLaufzeit: undefined })}
          className={`flex items-start gap-4 w-full rounded-xl border p-5 text-left transition-all ${
            declines
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              declines ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
            }`}
          >
            <Shield
              className={`h-5 w-5 ${declines ? "text-[#FFC62C]" : "text-[#8B8F97]"}`}
            />
          </div>
          <div>
            <p className={`font-semibold ${declines ? "text-[#FFC62C]" : "text-white"}`}>
              Nein, nur den inkludierten Monat
            </p>
            <p className="text-sm text-[#6a6e76] mt-0.5">
              1 Monat Betrieb &amp; Wartung ist im Festpreis dabei. Danach übernehme ich selbst.
            </p>
          </div>
        </button>

        {/* Option: Komplett ohne Support */}
        <button
          type="button"
          onClick={() => onChange({ betriebUndWartung: "ohne", betriebLaufzeit: undefined })}
          className={`flex items-start gap-4 w-full rounded-xl border p-5 text-left transition-all ${
            noSupport
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              noSupport ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
            }`}
          >
            <ShieldOff
              className={`h-5 w-5 ${noSupport ? "text-[#FFC62C]" : "text-[#8B8F97]"}`}
            />
          </div>
          <div>
            <p className={`font-semibold ${noSupport ? "text-[#FFC62C]" : "text-white"}`}>
              Komplett ohne Support
            </p>
            <p className="text-sm text-[#6a6e76] mt-0.5">
              Auch den inkludierten Monat brauche ich nicht — ich habe eigene Leute dafür.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
