import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SlotPicker from "@/components/booking/SlotPicker";
import { OnboardingRating } from "@/components/onboarding/OnboardingRating";
import { getSubmissionById } from "@/lib/submissions";

export const metadata: Metadata = {
  title: "Vielen Dank — Ihre Anfrage wurde gesendet",
  description:
    "Wir haben Ihre Projektanfrage erhalten und erstellen Ihnen ein individuelles Angebot.",
};

function getSlaLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
}

function formatEur(n: number): string {
  return n.toLocaleString("de-DE") + " €";
}

interface PageProps {
  searchParams: Promise<{ typ?: string; sid?: string }>;
}

export default async function BestaetigungPage({ searchParams }: PageProps) {
  const { typ, sid } = await searchParams;
  const isCall = typ === "call";

  // Get submission data for SLA and range info
  const submission = sid ? await getSubmissionById(sid) : undefined;
  const slaMinutes = submission?.slaMinutes ?? 60;
  const slaLabel = getSlaLabel(slaMinutes);
  const range = submission?.range;

  return (
    <section className="relative min-h-screen bg-[#111318]">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          {/* Success icon */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFC62C]/[0.1] ring-1 ring-[#FFC62C]/20">
            <CheckCircle2 className="h-10 w-10 text-[#FFC62C]" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Vielen Dank für Ihre Anfrage!
          </h1>

          {isCall ? (
            <>
              <p className="mt-4 text-lg text-[#8B8F97]">
                Buchen Sie jetzt Ihren Termin — wir gehen Ihr Vorhaben
                gemeinsam durch.
              </p>

              {/* Estimate range (if available) */}
              {range && (
                <div className="mt-8 rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-5">
                  <p className="text-sm text-[#8B8F97] mb-2">
                    Ihre vorläufige Schätzung:
                  </p>
                  <p className="text-xl font-bold text-[#FFC62C]">
                    ab {formatEur(range.untergrenze)} — ca.{" "}
                    {formatEur(range.obergrenze)}
                  </p>
                  <p className="text-xs text-[#6a6e76] mt-2">
                    Ihr endgültiger Festpreis wird nach dem Gespräch
                    individuell für Sie erstellt.
                  </p>
                </div>
              )}

              {/* Slot Picker */}
              {sid ? (
                <SlotPicker submissionId={sid} />
              ) : (
                <div className="mt-12 space-y-6">
                  <div className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/20">
                      <Clock className="h-5 w-5 text-[#FFC62C]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Termin wird vorbereitet
                      </p>
                      <p className="mt-1 text-sm text-[#6a6e76]">
                        Wir melden uns in Kürze bei Ihnen, um einen passenden
                        Termin zu vereinbaren.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding rating */}
              <OnboardingRating submissionId={sid} />

              {/* Back to homepage */}
              <div className="mt-8">
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    Zurück zur Startseite
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-lg text-[#8B8F97]">
                Sie erhalten Ihr verbindliches Angebot innerhalb von{" "}
                <span className="text-[#FFC62C] font-semibold">
                  {slaLabel}
                </span>{" "}
                per E-Mail.
              </p>

              {/* Estimate range (if available) */}
              {range && (
                <div className="mt-8 rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-5">
                  <p className="text-sm text-[#8B8F97] mb-2">
                    Ihre vorläufige Schätzung:
                  </p>
                  <p className="text-xl font-bold text-[#FFC62C]">
                    ab {formatEur(range.untergrenze)} — ca.{" "}
                    {formatEur(range.obergrenze)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Shield className="h-4 w-4 text-[#FFC62C]" />
                    <p className="text-xs text-[#8B8F97]">
                      Inkl. 1 Monat Betrieb &amp; Wartung nach dem Start
                    </p>
                  </div>
                </div>
              )}

              {/* Angebot flow steps */}
              <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/20">
                    <Clock className="h-5 w-5 text-[#FFC62C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      Angebot in {slaLabel}
                    </p>
                    <p className="mt-1 text-sm text-[#6a6e76]">
                      Wir prüfen Ihre Anforderungen und erstellen ein
                      detailliertes Angebot mit Kostenrahmen, Zeitplan und
                      Scope-Annahmen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                    <LinkIcon className="h-5 w-5 text-[#8B8F97]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      Ein Klick zur Bestätigung
                    </p>
                    <p className="mt-1 text-sm text-[#6a6e76]">
                      Sie erhalten einen persönlichen Link per E-Mail, über den
                      Sie das Angebot mit einem Klick annehmen oder ablehnen
                      können — ohne Telefonate oder Wartezeiten.
                    </p>
                  </div>
                </div>
              </div>

              {/* Onboarding rating */}
              <OnboardingRating submissionId={sid} />

              {/* Back to homepage */}
              <div className="mt-8">
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    Zurück zur Startseite
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
