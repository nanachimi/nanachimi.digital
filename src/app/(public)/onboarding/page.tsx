import type { Metadata } from "next";
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
          <OnboardingForm />
        </div>
      </div>
    </section>
  );
}
