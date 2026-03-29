import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";

interface CTASectionProps {
  headline?: string;
  subtext?: string;
}

export function CTASection({
  headline = "Bereit, Ihr Vorhaben umzusetzen?",
  subtext = "Beschreiben Sie in 3 Minuten, was Sie brauchen — wir liefern eine erste Einschätzung. Oder buchen Sie direkt ein kostenloses Gespräch.",
}: CTASectionProps) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1d22] via-[#111318] to-[#0d0f14]" />
      {/* Gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#FFC62C]/[0.06] blur-[150px]" />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,198,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,198,44,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container relative mx-auto px-4 text-center md:px-6">
        <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
          {headline}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[#8B8F97]">
          {subtext}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-14 px-10 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_30px_rgba(255,198,44,0.3)] hover:shadow-[0_0_40px_rgba(255,198,44,0.4)] transition-all"
          >
            <Link href="/onboarding">
              Jetzt starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-base font-semibold border border-white/[0.25] bg-transparent text-white hover:bg-white/[0.08] hover:border-white/[0.4] rounded-xl transition-all"
          >
            <Link href="/kontakt">
              <CalendarDays className="mr-2 h-5 w-5" />
              Erstgespräch buchen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
