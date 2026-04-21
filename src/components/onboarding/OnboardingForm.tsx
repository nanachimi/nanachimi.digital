"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck, FileText } from "lucide-react";
import Link from "next/link";
import { hasAnalyticsConsent } from "@/lib/consent";
import { StepKontaktdaten } from "./StepKontaktdaten";
import { StepProjekttyp } from "./StepProjekttyp";
import { StepBeschreibung } from "./StepBeschreibung";
import { StepFunktionen } from "./StepFunktionen";
import { StepNutzerrollen } from "./StepNutzerrollen";
import { StepDesign } from "./StepDesign";
import { StepBranding } from "./StepBranding";
import { StepInspiration } from "./StepInspiration";
import { StepMonetarisierung } from "./StepMonetarisierung";
import { StepZeitrahmen } from "./StepZeitrahmen";
import { StepBudget } from "./StepBudget";
import { StepBetrieb } from "./StepBetrieb";
import { StepAbschluss } from "./StepAbschluss";
import { ProgressBar } from "./ProgressBar";
import type { OnboardingData } from "@/lib/onboarding-schema";

const TOTAL_STEPS = 13;
const STORAGE_KEY = "nanachimi_onboarding";
const CONSENT_KEY = "nanachimi_storage_consent";

const stepTitles = [
  "Welche Art von Lösung brauchen Sie?",   // 1
  "Erzählen Sie uns davon",                // 2
  "Wer wird das nutzen?",                  // 3 (merged: Zielgruppe + Nutzerrollen)
  "Was soll möglich sein?",                // 4
  "Wie soll es aussehen?",                 // 5
  "Ihr Branding & Artefakte",              // 6
  "Gibt es Projekte, die Sie inspirieren?",// 7 (NEU)
  "Wie soll Ihr Projekt Geld verdienen?",  // 8 (NEU)
  "Wann soll es fertig sein?",             // 9
  "In welchem Rahmen?",                    // 10
  "Und nach dem Start?",                   // 11
  "Kontaktdaten",                          // 12
  "Ihre Einschätzung",                     // 13
];

function hasStorageConsent(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

function loadSavedData(): { step: number; data: Partial<OnboardingData> } | null {
  try {
    if (!hasStorageConsent()) return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveData(step: number, data: Partial<OnboardingData>) {
  try {
    if (!hasStorageConsent()) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
  } catch {
    // silently fail
  }
}

function clearSavedData() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

interface ClientEstimate {
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

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    funktionen: [],
  });
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [clientEstimate, setClientEstimate] = useState<ClientEstimate | null>(null);

  // --- Funnel tracking ---
  const sessionIdRef = useRef(crypto.randomUUID());
  const stepEnteredAtRef = useRef<number>(Date.now());

  const getVisitorId = useCallback((): string => {
    const match = document.cookie.match(/(?:^|; )ncd-ab=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : "anonymous";
  }, []);

  const trackOnboarding = useCallback(
    (eventType: string, stepNum: number, stepName: string, duration?: number) => {
      if (!hasAnalyticsConsent()) return;
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "onboarding",
          visitorId: getVisitorId(),
          sessionId: sessionIdRef.current,
          step: stepNum,
          stepName,
          eventType,
          duration,
        }),
      }).catch(() => {});
    },
    [getVisitorId]
  );

  // On mount: check for consent and restore data
  useEffect(() => {
    const consent = hasStorageConsent();
    setConsentGiven(consent);

    if (consent) {
      const saved = loadSavedData();
      if (saved) {
        setStep(saved.step);
        setData(saved.data);
      }
      setShowConsentBanner(false);
    } else {
      setShowConsentBanner(true);
    }

    // Capture UTM parameters from the URL once on mount so they get saved
    // onto the Submission for affiliate/campaign attribution analytics.
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source") || undefined;
      const utmMedium = params.get("utm_medium") || undefined;
      const utmCampaign = params.get("utm_campaign") || undefined;
      if (utmSource || utmMedium || utmCampaign) {
        setData((prev) => ({
          ...prev,
          utmSource: prev.utmSource ?? utmSource,
          utmMedium: prev.utmMedium ?? utmMedium,
          utmCampaign: prev.utmCampaign ?? utmCampaign,
        }));
      }
    } catch {
      // window.location.search unavailable — ignore
    }

    // Track initial step entry
    trackOnboarding("step_enter", 1, stepTitles[0]);
    stepEnteredAtRef.current = Date.now();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track abandonment on unload
  useEffect(() => {
    const handleUnload = () => {
      if (!hasAnalyticsConsent()) return;
      const duration = Math.round((Date.now() - stepEnteredAtRef.current) / 1000);
      const data = JSON.stringify({
        type: "onboarding",
        visitorId: getVisitorId(),
        sessionId: sessionIdRef.current,
        step,
        stepName: stepTitles[step - 1],
        eventType: "abandon",
        duration,
      });
      navigator.sendBeacon("/api/analytics/track", data);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [step, getVisitorId]);

  // Persist data on change (if consent given)
  useEffect(() => {
    if (consentGiven) {
      saveData(step, data);
    }
  }, [step, data, consentGiven]);

  function handleConsent(accepted: boolean) {
    if (accepted) {
      try {
        sessionStorage.setItem(CONSENT_KEY, "true");
      } catch {
        // silently fail
      }
      setConsentGiven(true);
    } else {
      setConsentGiven(false);
    }
    setShowConsentBanner(false);
  }

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function next() {
    if (step < TOTAL_STEPS) {
      // Track step completion with duration
      const duration = Math.round((Date.now() - stepEnteredAtRef.current) / 1000);
      trackOnboarding("step_complete", step, stepTitles[step - 1], duration);

      const nextStep = step + 1;
      setStep(nextStep);

      // Track next step entry
      trackOnboarding("step_enter", nextStep, stepTitles[nextStep - 1]);
      stepEnteredAtRef.current = Date.now();

      // Fetch client-side estimate when reaching the final step
      if (nextStep === TOTAL_STEPS) {
        fetchEstimate();
      }
    }
  }

  async function fetchEstimate() {
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const est = await res.json();
        setClientEstimate(est);
      }
    } catch {
      // Estimate is optional — continue without it
    }
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        const typ = data.naechsterSchritt || "angebot";

        // Track final step completion and funnel complete
        const duration = Math.round((Date.now() - stepEnteredAtRef.current) / 1000);
        trackOnboarding("step_complete", step, stepTitles[step - 1], duration);
        trackOnboarding("funnel_complete", step, stepTitles[step - 1]);

        // Track conversion path
        if (hasAnalyticsConsent()) {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "conversion",
              visitorId: getVisitorId(),
              conversionType: "conversion_path",
              conversionPath: typ,
              page: "/onboarding",
            }),
          }).catch(() => {});
        }

        // Clear saved data after successful submission
        clearSavedData();
        window.location.href = `/onboarding/bestaetigung?typ=${typ}&sid=${result.id}`;
      }
    } catch {
      // Handle error silently for now
    } finally {
      setIsSubmitting(false);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: // Projekttyp — must select one
        return !!data.projekttyp;
      case 2: // Beschreibung — min 10 chars
        return !!(data.beschreibung && data.beschreibung.trim().length >= 10);
      case 3: // Nutzerrollen
        if (!data.rollenAnzahl) return false;
        if (data.rollenAnzahl === "1") {
          // Single group — rollenName is mandatory
          return !!(data.rollenName && data.rollenName.trim().length > 0);
        }
        if (data.rollenAnzahl === "2" || data.rollenAnzahl === "3+") {
          // "unsicher" requires manual appStruktur selection
          if (data.projekttyp === "unsicher" && !data.appStruktur) return false;
          // All group names must be filled
          if (!data.rollenApps || data.rollenApps.length === 0) return false;
          if (!data.rollenApps.every((r) => r.rolle.trim().length > 0)) return false;
          // "beides" requires both platforms covered across groups
          if (data.projekttyp === "beides") {
            const allTypes = new Set(data.rollenApps.flatMap((r) => r.appTyp));
            if (!allTypes.has("web") || !allTypes.has("mobile")) return false;
          }
          return true;
        }
        return true;
      case 4: // Funktionen — at least 1 selected
        return !!(data.funktionen && data.funktionen.length > 0);
      case 5: // Design — must select one
        return !!data.designLevel;
      case 6: // Branding — all optional, always can proceed
        return true;
      case 7: // Inspiration — optional, always can proceed
        return true;
      case 8: // Monetarisierung — at least 1 selected
        return !!(data.monetarisierung && data.monetarisierung.length > 0);
      case 9: // Zeitrahmen — both fields required
        return !!(data.zeitrahmenMvp && data.zeitrahmenFinal);
      case 10: // Budget — must select one
        return !!data.budget;
      case 11: // Betrieb & Wartung — must select one; if "ja", laufzeit required
        if (!data.betriebUndWartung) return false;
        if (data.betriebUndWartung === "ja" && !data.betriebLaufzeit) return false;
        return true;
      case 12: // Kontaktdaten — email + name required
        return !!(
          data.email &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
          data.name &&
          data.name.trim().length >= 2
        );
      case 13: // Abschluss — must choose call or angebot
        return !!data.naechsterSchritt;
      default:
        return true;
    }
  }

  const stepComponents: Record<number, React.ReactNode> = {
    1: <StepProjekttyp data={data} onChange={updateData} />,
    2: <StepBeschreibung data={data} onChange={updateData} />,
    3: <StepNutzerrollen data={data} onChange={updateData} />,
    4: <StepFunktionen data={data} onChange={updateData} />,
    5: <StepDesign data={data} onChange={updateData} />,
    6: <StepBranding data={data} onChange={updateData} />,
    7: <StepInspiration data={data} onChange={updateData} />,
    8: <StepMonetarisierung data={data} onChange={updateData} />,
    9: <StepZeitrahmen data={data} onChange={updateData} />,
    10: <StepBudget data={data} onChange={updateData} />,
    11: <StepBetrieb data={data} onChange={updateData} />,
    12: <StepKontaktdaten data={data} onChange={updateData} />,
    13: <StepAbschluss data={data} onChange={updateData} estimate={clientEstimate ?? undefined} />,
  };

  return (
    <div>
      {/* Consent banner */}
      {showConsentBanner && (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#FFC62C] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">
                Fortschritt speichern?
              </p>
              <p className="text-xs text-[#8B8F97] leading-relaxed">
                Wir können Ihren Fortschritt im Browser zwischenspeichern
                (SessionStorage), damit Ihre Eingaben bei einem Seitenneuladen
                nicht verloren gehen. Die Daten werden nur in Ihrem Browser
                gespeichert und automatisch gelöscht, wenn Sie den Tab schließen.{" "}
                <a href="/datenschutz" className="text-[#FFC62C] underline hover:text-[#e6b228]">
                  Datenschutz
                </a>
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleConsent(true)}
                  className="rounded-lg bg-[#FFC62C] px-4 py-1.5 text-xs font-bold text-[#111318] hover:bg-[#e6b228] transition-colors"
                >
                  Ja, speichern
                </button>
                <button
                  onClick={() => handleConsent(false)}
                  className="rounded-lg border border-white/[0.08] px-4 py-1.5 text-xs font-medium text-[#8B8F97] hover:border-white/20 hover:text-white transition-colors"
                >
                  Nein, danke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.08] px-4 py-2 mb-6">
          <Sparkles className="h-4 w-4 text-[#FFC62C]" />
          <span className="text-sm font-medium text-[#FFC62C]">
            In 3 Minuten zur Einschätzung
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Ihr Vorhaben beschreiben
        </h1>
        <p className="mt-3 text-[#8B8F97]">
          {TOTAL_STEPS} kurze Fragen — keine technischen Kenntnisse nötig.
          Wir erstellen Ihnen eine erste Einschätzung.
        </p>
      </div>

      {/* PDF Upload Shortcut — below title */}
      <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/20">
            <FileText className="h-5 w-5 text-[#FFC62C]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              Sie haben Ihr Konzept bereits als PDF?
            </p>
            <p className="mt-1 text-sm text-[#8B8F97]">
              Laden Sie es hoch — wir analysieren es und stellen Ihnen nur
              die fehlenden Fragen.
            </p>
            <Link
              href="/onboarding/pdf-upload"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#FFC62C] hover:text-[#FFD44D] transition-colors"
            >
              PDF hochladen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* Step content */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FFC62C] mb-1">
          Frage {step} von {TOTAL_STEPS}{step >= 9 ? " — dauert nur noch kurz" : ""}
        </p>
        <h2 className="text-xl font-bold text-white mb-6">
          {stepTitles[step - 1]}
        </h2>

        {stepComponents[step]}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 1}
          className="text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        {step < TOTAL_STEPS ? (
          <Button
            onClick={next}
            disabled={!canProceed()}
            className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-8 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Weiter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-8 shadow-[0_0_20px_rgba(255,198,44,0.3)]"
          >
            {isSubmitting ? "Wird gesendet..." : "Angebot anfordern"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
