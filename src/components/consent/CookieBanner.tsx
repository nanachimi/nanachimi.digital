"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import type { ConsentPreferences } from "@/lib/consent";

interface Props {
  currentPrefs: ConsentPreferences | null;
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  onSavePreferences: (analytics: boolean) => void;
}

export function CookieBanner({
  currentPrefs,
  onAcceptAll,
  onAcceptNecessary,
  onSavePreferences,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    currentPrefs?.analytics ?? false
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#111318]/95 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
      <div className="container mx-auto px-4 py-5 md:px-6">
        {!showDetails ? (
          /* ── Simple view ──────────────────────────────────── */
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="h-5 w-5 text-[#FFC62C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#c8cad0] leading-relaxed">
                  Wir nutzen Cookies, um unsere Website zu verbessern und Ihre
                  Nutzung zu analysieren. Weitere Informationen finden Sie in
                  unserer{" "}
                  <Link
                    href="/datenschutz"
                    className="text-[#FFC62C] underline hover:text-[#e6b228]"
                  >
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={onAcceptAll}
                className="rounded-xl bg-[#FFC62C] px-5 py-2.5 text-sm font-bold text-[#111318] hover:bg-[#e6b228] transition-colors"
              >
                Alle akzeptieren
              </button>
              <button
                onClick={onAcceptNecessary}
                className="rounded-xl border border-white/[0.15] px-5 py-2.5 text-sm font-medium text-[#c8cad0] hover:border-white/30 hover:text-white transition-colors"
              >
                Nur notwendige
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-3 py-2.5 text-sm text-[#8B8F97] hover:text-white transition-colors"
              >
                Einstellungen
              </button>
            </div>
          </div>
        ) : (
          /* ── Detail view ──────────────────────────────────── */
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#FFC62C] shrink-0 mt-0.5" />
              <p className="text-sm text-[#c8cad0]">
                Hier können Sie Ihre Cookie-Einstellungen anpassen.
              </p>
            </div>

            <div className="space-y-3">
              {/* Necessary — always on */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">Notwendig</p>
                  <p className="text-xs text-[#8B8F97] mt-0.5">
                    Erforderlich für die Grundfunktionen der Website.
                  </p>
                </div>
                <div className="relative">
                  <div className="h-6 w-11 rounded-full bg-[#FFC62C]/30 cursor-not-allowed">
                    <div className="absolute top-0.5 left-[22px] h-5 w-5 rounded-full bg-[#FFC62C] shadow" />
                  </div>
                </div>
              </div>

              {/* Analytics — toggleable */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Analyse &amp; Optimierung
                  </p>
                  <p className="text-xs text-[#8B8F97] mt-0.5">
                    Hilft uns, die Website und das Onboarding zu verbessern.
                  </p>
                </div>
                <button
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className="relative h-6 w-11 rounded-full transition-colors"
                  style={{
                    backgroundColor: analyticsEnabled
                      ? "rgba(255,198,44,0.3)"
                      : "rgba(255,255,255,0.1)",
                  }}
                  role="switch"
                  aria-checked={analyticsEnabled}
                >
                  <div
                    className="absolute top-0.5 h-5 w-5 rounded-full shadow transition-all"
                    style={{
                      left: analyticsEnabled ? "22px" : "2px",
                      backgroundColor: analyticsEnabled
                        ? "#FFC62C"
                        : "#6a6e76",
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSavePreferences(analyticsEnabled)}
                className="rounded-xl border border-white/[0.15] px-5 py-2.5 text-sm font-medium text-[#c8cad0] hover:border-white/30 hover:text-white transition-colors"
              >
                Auswahl speichern
              </button>
              <button
                onClick={onAcceptAll}
                className="rounded-xl bg-[#FFC62C] px-5 py-2.5 text-sm font-bold text-[#111318] hover:bg-[#e6b228] transition-colors"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
