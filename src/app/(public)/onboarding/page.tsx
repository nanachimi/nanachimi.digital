import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const metadata: Metadata = {
  title: "Projekt starten — Onboarding",
  description:
    "Teilen Sie uns Ihre Anforderungen mit und erhalten Sie in wenigen Minuten eine grobe Aufwandsschätzung. Kein Verkaufsgespräch nötig.",
};

export default function OnboardingPage() {
  return (
    <section className="relative min-h-screen bg-[#111318]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl">
          {/* PDF Upload Shortcut */}
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
                  Laden Sie es hoch — wir analysieren es mit KI und stellen
                  Ihnen nur die fehlenden Fragen.
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

          <OnboardingForm />
        </div>
      </div>
    </section>
  );
}
