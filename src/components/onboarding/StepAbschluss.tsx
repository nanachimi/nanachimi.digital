"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, Mail, Shield, Clock, Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
  estimate?: {
    range: { untergrenze: number; obergrenze: number };
    aufwand: number;
    riskLevel: "low" | "medium" | "high";
    slaMinutes: number;
    bwInfo: {
      includedMonths: number;
      packages: { months: number; pricePerMonth: number }[];
      customerWants: boolean;
    };
  };
}

function formatEur(n: number): string {
  return n.toLocaleString("de-DE") + " €";
}

function getSlaLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
}

export function StepAbschluss({ data, onChange, estimate }: Props) {
  const riskLevel = estimate?.riskLevel ?? "low";
  const slaLabel = useMemo(
    () => getSlaLabel(estimate?.slaMinutes ?? 30),
    [estimate?.slaMinutes]
  );

  // Promo code live validation (case-sensitive, debounced on change).
  const [promoStatus, setPromoStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "valid"; discountPercent: number; code: string }
    | { state: "invalid"; reason: string }
  >({ state: "idle" });

  useEffect(() => {
    const code = (data.promoCode ?? "").trim();
    if (!code) {
      setPromoStatus({ state: "idle" });
      return;
    }
    setPromoStatus({ state: "checking" });
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.valid) {
          setPromoStatus({
            state: "valid",
            discountPercent: json.discountPercent,
            code: json.code,
          });
        } else {
          setPromoStatus({
            state: "invalid",
            reason: json?.reason ?? "not_found",
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setPromoStatus({ state: "invalid", reason: "network_error" });
        }
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [data.promoCode]);

  // Layout priority based on risk level
  const isLow = riskLevel === "low";
  const isHigh = riskLevel === "high";

  return (
    <div className="space-y-6">
      {/* ── Preliminary Estimate ────────────────────────────── */}
      {estimate && (
        <div className="rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-6">
          <h3 className="text-lg font-bold text-white mb-1">
            Ihre erste Projekteinschätzung
          </h3>
          <p className="text-sm text-[#8B8F97] mb-5">
            Diese Schätzung basiert auf Ihren Angaben und dient als erste
            Orientierung. Ihr endgültiger Festpreis wird individuell für Sie
            erstellt — transparent und ohne versteckte Kosten.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {/* Price range */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-1">
                Preisrahmen
              </p>
              <p className="text-xl font-bold text-[#FFC62C]">
                ab {formatEur(estimate.range.untergrenze)} — ca.{" "}
                {formatEur(estimate.range.obergrenze)}
              </p>
            </div>

            {/* Effort */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-1">
                Geschätzter Aufwand
              </p>
              <p className="text-xl font-bold text-white">
                ca. {estimate.aufwand} Personentage
              </p>
            </div>
          </div>

          {/* B&W info */}
          <div className="flex items-start gap-2 text-sm text-[#8B8F97]">
            <Shield className="h-4 w-4 mt-0.5 shrink-0 text-[#FFC62C]" />
            <div>
              <span className="text-white font-medium">
                Inklusive: {estimate.bwInfo.includedMonths} Monat Betrieb &amp;
                Wartung nach dem Start.
              </span>
              {estimate.bwInfo.customerWants ? (() => {
                const laufzeit = data.betriebLaufzeit;
                const paket = laufzeit
                  ? estimate.bwInfo.packages.find((p) => p.months === Number(laufzeit))
                  : null;
                return paket ? (
                  <span>
                    {" "}
                    Danach: {paket.pricePerMonth} €/Monat für{" "}
                    {paket.months} Monate
                  </span>
                ) : (
                  <span>
                    {" "}
                    Danach: ab{" "}
                    {Math.min(
                      ...estimate.bwInfo.packages.map((p) => p.pricePerMonth)
                    )}{" "}
                    €/Monat (optional, separat buchbar)
                  </span>
                );
              })() : (
                <span> Danach eigenverantwortlicher Betrieb.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Conversion Paths ───────────────────────────────── */}
      <div>
        <p className="text-[#c8cad0] font-medium mb-1">
          Wie möchten Sie weitermachen?
        </p>
        <p className="text-sm text-[#8B8F97] mb-4">
          Wählen Sie die Option, die am besten zu Ihnen passt.
        </p>
      </div>

      <div
        className={`grid gap-3 sm:grid-cols-2 items-stretch`}
      >
        {/* Path B — Angebot direkt anfordern */}
        <button
          type="button"
          onClick={() => onChange({ naechsterSchritt: "angebot" })}
          className={`group relative flex h-full flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${
            isHigh ? "order-2" : "order-1"
          } ${
            data.naechsterSchritt === "angebot"
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08] ring-1 ring-[#FFC62C]/30"
              : isLow
                ? "border-[#FFC62C]/30 bg-[#FFC62C]/[0.04] hover:border-[#FFC62C]/40"
                : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]"
          }`}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
              data.naechsterSchritt === "angebot"
                ? "bg-[#FFC62C]/20 text-[#FFC62C]"
                : isLow
                  ? "bg-[#FFC62C]/10 text-[#FFC62C]"
                  : "bg-white/[0.06] text-[#8B8F97] group-hover:text-white/80"
            }`}
          >
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p
              className={`font-semibold transition-colors ${
                data.naechsterSchritt === "angebot"
                  ? "text-[#FFC62C]"
                  : "text-white"
              }`}
            >
              Direkt loslegen
            </p>
            <p className="mt-1 text-sm text-[#8B8F97] leading-relaxed">
              Sie erhalten Ihr Angebot mit Festpreis innerhalb von{" "}
              <span className="text-[#FFC62C] font-medium">{slaLabel}</span> per
              E-Mail — ein Klick zur Bestätigung.
              {isHigh && (
                <span className="block mt-1 text-[#6a6e76] text-xs">
                  Bei umfangreichen Vorhaben empfehlen wir ein persönliches
                  Gespräch.
                </span>
              )}
            </p>
          </div>
          {/* Response time badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5 text-[#FFC62C]" />
            <span className="text-xs text-[#FFC62C] font-medium">
              Antwort in {slaLabel}
            </span>
          </div>

          {/* Selection indicator */}
          <div
            className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 transition-all ${
              data.naechsterSchritt === "angebot"
                ? "border-[#FFC62C] bg-[#FFC62C]"
                : "border-white/20"
            }`}
          >
            {data.naechsterSchritt === "angebot" && (
              <svg
                className="h-full w-full text-[#111318]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Path A — Call buchen */}
        <button
          type="button"
          onClick={() => onChange({ naechsterSchritt: "call" })}
          className={`group relative flex h-full flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${
            isHigh ? "order-1" : "order-2"
          } ${
            data.naechsterSchritt === "call"
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08] ring-1 ring-[#FFC62C]/30"
              : isHigh
                ? "border-[#FFC62C]/30 bg-[#FFC62C]/[0.04] hover:border-[#FFC62C]/40"
                : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]"
          }`}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
              data.naechsterSchritt === "call"
                ? "bg-[#FFC62C]/20 text-[#FFC62C]"
                : isHigh
                  ? "bg-[#FFC62C]/10 text-[#FFC62C]"
                  : "bg-white/[0.06] text-[#8B8F97] group-hover:text-white/80"
            }`}
          >
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <p
              className={`font-semibold transition-colors ${
                data.naechsterSchritt === "call"
                  ? "text-[#FFC62C]"
                  : "text-white"
              }`}
            >
              Persönlich besprechen
            </p>
            <p className="mt-1 text-sm text-[#8B8F97] leading-relaxed">
              Wir gehen Ihr Vorhaben gemeinsam durch und klären alles Offene —
              kostenlos und unverbindlich.
            </p>
          </div>

          {/* Selection indicator */}
          <div
            className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 transition-all ${
              data.naechsterSchritt === "call"
                ? "border-[#FFC62C] bg-[#FFC62C]"
                : "border-white/20"
            }`}
          >
            {data.naechsterSchritt === "call" && (
              <svg
                className="h-full w-full text-[#111318]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Additional info */}
      <div className="pt-2">
        <Label className="text-[#c8cad0]">
          Gibt es noch etwas, das wir wissen sollten?
        </Label>
        <p className="text-sm text-[#8B8F97] mt-1 mb-3">
          Besondere Anforderungen, bestehende Systeme, Integrationen oder andere
          relevante Informationen.
        </p>
        <Textarea
          value={data.zusatzinfo || ""}
          onChange={(e) => onChange({ zusatzinfo: e.target.value })}
          placeholder="Optional: Weitere Informationen zu Ihrem Projekt..."
          rows={4}
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
        />
      </div>

      {/* Promo / Gutschein code */}
      <div className="pt-2">
        <Label className="text-[#c8cad0] flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#FFC62C]" />
          Gutscheincode
        </Label>
        <p className="text-sm text-[#8B8F97] mt-1 mb-3">
          Haben Sie einen Code erhalten? Geben Sie ihn hier ein — der Rabatt
          wird in Ihrem Angebot automatisch angewendet.
        </p>
        <div className="relative">
          <Input
            value={data.promoCode ?? ""}
            onChange={(e) => onChange({ promoCode: e.target.value })}
            placeholder="Optional (z. B. SysysStartup50)"
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 pr-10 font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {promoStatus.state === "checking" && (
              <Loader2 className="h-4 w-4 text-[#8B8F97] animate-spin" />
            )}
            {promoStatus.state === "valid" && (
              <Check className="h-4 w-4 text-emerald-400" />
            )}
            {promoStatus.state === "invalid" && (
              <X className="h-4 w-4 text-red-400" />
            )}
          </div>
        </div>
        {promoStatus.state === "valid" && (
          <p className="mt-2 text-xs text-emerald-400">
            ✓ Gutschein gültig — {promoStatus.discountPercent}% Rabatt auf den
            Festpreis
          </p>
        )}
        {promoStatus.state === "invalid" && (
          <p className="mt-2 text-xs text-red-400">
            ✗ Code ungültig oder abgelaufen
          </p>
        )}
      </div>
    </div>
  );
}
