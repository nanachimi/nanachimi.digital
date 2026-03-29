"use client";

import { TrendingUp, Clock, Zap, Rocket, ArrowRight, CalendarX, BrainCircuit, HandCoins, Timer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useABTest } from "@/components/ab/ABProvider";

// ─── Variant A: FOMO — "Ihre Konkurrenz baut bereits" ───────────

const FOMO_REASONS = [
  {
    icon: Rocket,
    title: "Wer heute baut, gewinnt morgen",
    description:
      "Digitale Märkte bewegen sich schnell. Wer jetzt ein eigenes Produkt launcht, sichert sich einen Vorsprung — bevor die Konkurrenz aufholt.",
    color: "text-[#FFC62C]",
    bgColor: "bg-[#FFC62C]/[0.08]",
    hoverBg: "group-hover:bg-[#FFC62C]/[0.15]",
  },
  {
    icon: TrendingUp,
    title: "Digitale Produkte skalieren ohne Sie",
    description:
      "Eine digitale Lösung arbeitet 24/7 — ohne Urlaub, ohne Krankheitstage. Einmal gebaut, spart sie Ihnen jeden Tag Zeit.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/[0.08]",
    hoverBg: "group-hover:bg-emerald-400/[0.15]",
  },
  {
    icon: Clock,
    title: "Der Markt wartet nicht",
    description:
      "Andere in Ihrer Branche sind schon digital unterwegs. Jeden Monat, den Sie warten, ist ein Monat, in dem jemand anderes Ihre Nische besetzt.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/[0.08]",
    hoverBg: "group-hover:bg-amber-400/[0.15]",
  },
  {
    icon: Zap,
    title: "So einfach war es noch nie",
    description:
      "In Tagen statt Monaten die erste Version starten. Die Einstiegshürde war noch nie so niedrig — ab 299 €.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/[0.08]",
    hoverBg: "group-hover:bg-blue-400/[0.15]",
  },
];

// ─── Variant B: Pain — "Wie viel kostet Sie der Alltag?" ─────────

const PAIN_REASONS = [
  {
    icon: CalendarX,
    title: "Jeden Tag die gleichen Handgriffe",
    description:
      "Termine koordinieren, Bestellungen abtippen, Rechnungen schreiben — manuell, immer wieder. Zeit, die Ihnen für Ihr Vorhaben fehlt.",
    color: "text-red-400",
    bgColor: "bg-red-400/[0.08]",
    hoverBg: "group-hover:bg-red-400/[0.15]",
  },
  {
    icon: BrainCircuit,
    title: "Alles im Kopf behalten",
    description:
      "Wer hat angerufen? Welche Rechnung ist offen? Was steht morgen an? Ohne System wächst das Chaos mit jedem Kunden.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/[0.08]",
    hoverBg: "group-hover:bg-amber-400/[0.15]",
  },
  {
    icon: HandCoins,
    title: "Jeden Tag kostet es Sie Geld",
    description:
      "Verpasste Anfragen, doppelte Arbeit, verlorene Zettel — das summiert sich. Eine digitale Lösung spart Ihnen ab dem ersten Tag.",
    color: "text-[#FFC62C]",
    bgColor: "bg-[#FFC62C]/[0.08]",
    hoverBg: "group-hover:bg-[#FFC62C]/[0.15]",
  },
  {
    icon: Timer,
    title: "In 48h kann sich alles ändern",
    description:
      "Beschreiben Sie Ihr Vorhaben — wir kümmern uns um alles Andere. Kein Technik-Stress, kein Risiko. Ab 299 € möglich.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/[0.08]",
    hoverBg: "group-hover:bg-emerald-400/[0.15]",
  },
];

// ─── Variant Configs ─────────────────────────────────────────────

interface UrgencyVariant {
  badge: string;
  heading: string;
  headingHighlight: string;
  subtext: string;
  reasons: typeof FOMO_REASONS;
  cta: string;
  ctaSub: string;
}

const VARIANTS: Record<string, UrgencyVariant> = {
  fomo: {
    badge: "Warum jetzt starten?",
    heading: "Ihre Konkurrenz baut bereits.",
    headingHighlight: "Wann starten Sie?",
    subtext:
      "Jede Woche entstehen neue digitale Produkte. Wer jetzt handelt, sichert sich einen Vorsprung — wer wartet, verliert.",
    reasons: FOMO_REASONS,
    cta: "Jetzt Idee einreichen",
    ctaSub: "Kostenlose Einschätzung in 3 Minuten — kein Verkaufsgespräch",
  },
  pain: {
    badge: "Kommt Ihnen das bekannt vor?",
    heading: "Excel, WhatsApp, Zettel.",
    headingHighlight: "Es geht auch anders.",
    subtext:
      "Als Gründer oder Selbstständiger verbringen Sie zu viel Zeit mit Aufgaben, die eine digitale Lösung für Sie erledigen könnte.",
    reasons: PAIN_REASONS,
    cta: "Jetzt Alltag vereinfachen",
    ctaSub: "Beschreiben Sie Ihre Aufgaben — wir zeigen Ihnen, was möglich ist",
  },
};

// ─── Component ───────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); } else { setCount(start); }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function UrgencySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const { config: abConfig, trackImpression } = useABTest("urgency-section");

  // Determine variant: "fomo" or "pain" (default: pain for Kleingewerbe)
  const variantId = (abConfig.variantId as string) || "pain";
  const variant = VARIANTS[variantId] || VARIANTS.pain;

  useEffect(() => {
    if (visible) trackImpression();
  }, [visible, trackImpression]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.05] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-emerald-400/[0.04] blur-[100px]" />
      </div>

      {/* Animated ring behind heading */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className={`h-[300px] w-[300px] rounded-full border border-[#FFC62C]/10 transition-all duration-[2000ms] ${visible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
        <div className={`absolute inset-0 h-[300px] w-[300px] rounded-full border border-[#FFC62C]/5 transition-all duration-[2500ms] delay-500 ${visible ? "scale-150 opacity-100" : "scale-0 opacity-0"}`} />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Header */}
        <div className={`mx-auto max-w-3xl text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.08] px-4 py-2 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFC62C] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFC62C]" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              {variant.badge}
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            {variant.heading}{" "}
            <span className="text-[#FFC62C]">{variant.headingHighlight}</span>
          </h2>
          <p className="mt-6 text-lg text-[#8B8F97] max-w-2xl mx-auto">
            {variant.subtext}
          </p>
        </div>

        {/* Stat counter bar */}
        <div className={`mx-auto max-w-3xl grid grid-cols-3 gap-4 mb-14 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-3xl font-black text-[#FFC62C]">
              <AnimatedCounter target={48} suffix="h" />
            </div>
            <div className="text-xs text-[#6a6e76] mt-1">Bis zum Go-Live</div>
          </div>
          <div className="text-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-3xl font-black text-emerald-400">Ab 299 €</div>
            <div className="text-xs text-[#6a6e76] mt-1">Ihre digitale Lösung</div>
          </div>
          <div className="text-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-3xl font-black text-blue-400">24/7</div>
            <div className="text-xs text-[#6a6e76] mt-1">Support & Betrieb</div>
          </div>
        </div>

        {/* Reason cards */}
        <div className="mx-auto max-w-4xl grid gap-6 sm:grid-cols-2">
          {variant.reasons.map((reason, i) => (
            <div
              key={i}
              className={`group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-700 hover:border-[#FFC62C]/20 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 ${
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: visible ? `${400 + i * 150}ms` : "0ms" }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${reason.bgColor} mb-4 ${reason.hoverBg} transition-colors`}>
                <reason.icon className={`h-6 w-6 ${reason.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {reason.title}
              </h3>
              <p className="text-sm text-[#8B8F97] leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`mt-14 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: visible ? "1000ms" : "0ms" }}>
          <Link href="/onboarding">
            <Button className="h-14 rounded-xl bg-[#FFC62C] px-8 text-base font-bold text-[#111318] shadow-[0_0_40px_rgba(255,198,44,0.3)] transition-all hover:bg-[#e6b228] hover:shadow-[0_0_50px_rgba(255,198,44,0.4)] hover:scale-[1.02]">
              {variant.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-[#6a6e76]">
            {variant.ctaSub}
          </p>
        </div>
      </div>
    </section>
  );
}
