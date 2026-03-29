"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Mail,
  Calendar,
  Sparkles,
} from "lucide-react";

interface EstimateData {
  id: string;
  festpreis: number;
  aufwand: number;
  assumptions: string[];
  exclusions: string[];
  riskLevel: string;
  contact: { name: string; email: string; firma?: string };
  projekttyp: string;
  funktionen: string[];
  zeitrahmen: string;
  designLevel: string;
}

function formatEur(n: number) {
  return new Intl.NumberFormat("de-DE").format(n);
}

export function EstimateResultClient() {
  const [estimate, setEstimate] = useState<EstimateData | null>(null);

  useEffect(() => {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("estimate="));
      if (cookie) {
        const data = JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("=")));
        setEstimate(data);
      }
    } catch {
      // No estimate found
    }
  }, []);

  if (!estimate) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white">
          Keine Schätzung gefunden
        </h1>
        <p className="mt-4 text-[#8B8F97]">
          Bitte durchlaufen Sie zuerst das Onboarding.
        </p>
        <Button
          asChild
          className="mt-8 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl"
        >
          <Link href="/onboarding">
            Zum Onboarding
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const riskColors = {
    low: "text-green-400 bg-green-400/10 border-green-400/20",
    medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    high: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  const riskLabels = { low: "Niedrig", medium: "Mittel", high: "Hoch" };
  const riskKey = estimate.riskLevel as keyof typeof riskColors;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.08] px-4 py-2 mb-6">
          <Sparkles className="h-4 w-4 text-[#FFC62C]" />
          <span className="text-sm font-medium text-[#FFC62C]">
            Ihre Einschätzung
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Grobe Aufwandsschätzung
        </h1>
        <p className="mt-3 text-[#8B8F97]">
          Hallo {estimate.contact.name}, hier ist Ihre erste Einschätzung.
        </p>
      </div>

      {/* Estimate */}
      <div className="rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.05] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C] mb-2">
          Geschätzter Festpreis
        </p>
        <div className="text-4xl font-black text-white md:text-5xl">
          {formatEur(estimate.festpreis)}{" "}
          <span className="text-2xl text-[#FFC62C]">EUR</span>
        </div>
        <p className="mt-2 text-sm text-[#8B8F97]">
          Geschätzter Aufwand: {estimate.aufwand} Personentage
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Badge
            className={`${riskColors[riskKey]} border`}
            variant="outline"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Risiko: {riskLabels[riskKey]}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="mt-8 space-y-6">
        {/* Assumptions */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="font-bold text-white mb-4">Annahmen</h3>
          <ul className="space-y-2.5">
            {estimate.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                <span className="text-[#c8cad0]">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exclusions */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="font-bold text-white mb-4">Nicht enthalten</h3>
          <ul className="space-y-2.5">
            {estimate.exclusions.map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#6a6e76]" />
                <span className="text-[#8B8F97]">{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="font-bold text-white mb-4">
            Berücksichtigte Funktionen ({estimate.funktionen.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {estimate.funktionen.map((f) => (
              <Badge
                key={f}
                variant="outline"
                className="border-white/10 text-[#c8cad0] bg-white/[0.03]"
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] p-4">
        <p className="text-sm text-[#FFC62C] font-medium">⚠️ Hinweis</p>
        <p className="text-sm text-[#8B8F97] mt-1">
          Dies ist eine grobe Schätzung basierend auf Ihren Angaben. Die
          tatsächlichen Kosten können je nach Detailgrad und Komplexität
          abweichen. Für eine verbindliche Kalkulation vereinbaren wir gerne
          ein Gespräch.
        </p>
      </div>

      {/* CTAs */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="flex-1 h-14 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_20px_rgba(255,198,44,0.3)]"
        >
          <Link href={`mailto:info@nanachimi.digital?subject=Projekt-Anfrage: ${estimate.contact.name}&body=Hallo, ich habe eine Schätzung von ${formatEur(estimate.festpreis)} EUR erhalten und möchte mein Projekt besprechen.`}>
            <Mail className="mr-2 h-5 w-5" />
            Per E-Mail kontaktieren
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="ghost"
          className="flex-1 h-14 text-base text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl border border-white/[0.08]"
        >
          <Link href="/kontakt">
            <Calendar className="mr-2 h-5 w-5" />
            Gespräch vereinbaren
          </Link>
        </Button>
      </div>
    </div>
  );
}
