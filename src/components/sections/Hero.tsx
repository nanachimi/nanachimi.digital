"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useABTest } from "@/components/ab/ABProvider";
import { HERO_VARIANTS } from "@/data/hero-variants";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count}{suffix}</>;
}

// ─── Chaos → Order Animation ─────────────────────────────────────
// Visualizes the daily struggle of solo entrepreneurs:
// Scattered sticky notes, messages, deadlines → organized dashboard

// Detailed pain-point cards that zoom into real daily chaos

const ORDER_ITEMS = [
  { emoji: "✅", label: "Aufgaben erledigt", progress: 100 },
  { emoji: "📊", label: "Alles im Blick", progress: 87 },
  { emoji: "🤝", label: "Kunden zufrieden", progress: 95 },
  { emoji: "⏱️", label: "Zeit gespart", progress: 72 },
];

function ChaosToOrderAnimation() {
  const [phase, setPhase] = useState<"chaos" | "transition" | "order">("chaos");

  useEffect(() => {
    const cycle = () => {
      setPhase("chaos");
      const t1 = setTimeout(() => setPhase("transition"), 3000);
      const t2 = setTimeout(() => setPhase("order"), 3800);
      const t3 = setTimeout(() => setPhase("chaos"), 8000);
      return [t1, t2, t3];
    };

    let timers = cycle();
    const interval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = cycle();
    }, 8000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 shadow-2xl overflow-hidden relative h-[360px]">
      {/* Phase label */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 transition-all duration-500 ${
          phase === "order" ? "opacity-0 -translate-y-2" : "opacity-100"
        }`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
          </span>
          <span className="text-xs font-medium text-red-400">Ihr Alltag heute</span>
        </div>
        <div className={`flex items-center gap-2 transition-all duration-500 ${
          phase === "order" ? "opacity-100" : "opacity-0 translate-y-2"
        }`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-400">Mit nanachimi.digital</span>
        </div>
      </div>

      {/* Chaos phase — zoomed pain point cards */}
      <div className={`absolute inset-6 top-14 transition-all duration-700 ${
        phase === "chaos"
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      }`}>
        {/* WhatsApp messages — top left, tilted */}
        <div className="absolute left-0 top-0 w-[55%] animate-in fade-in slide-in-from-left-4 duration-500" style={{ transform: "rotate(-2deg)" }}>
          <div className="rounded-xl bg-[#1a2e1a]/80 border border-[#25D366]/20 p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-full bg-[#25D366]/30 flex items-center justify-center">
                <span className="text-[10px]">📱</span>
              </div>
              <span className="text-[10px] font-bold text-[#25D366]">WhatsApp</span>
              <span className="ml-auto rounded-full bg-[#25D366] px-1.5 py-0.5 text-[8px] font-bold text-white">12</span>
            </div>
            <div className="space-y-1.5">
              <div className="rounded-lg bg-white/[0.06] px-2.5 py-1.5">
                <p className="text-[9px] text-[#6a6e76]">Kunde Müller · 09:14</p>
                <p className="text-[10px] text-white/80">Wann ist meine Bestellung da?? 😤</p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-2.5 py-1.5">
                <p className="text-[9px] text-[#6a6e76]">Lieferant Schmidt · 10:31</p>
                <p className="text-[10px] text-white/80">Rechnung überfällig, bitte dringend!</p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-2.5 py-1.5">
                <p className="text-[9px] text-[#6a6e76]">Team-Gruppe · 11:02</p>
                <p className="text-[10px] text-white/80">Wer hat den Zugang zum Lager?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Missed calls — top right */}
        <div className="absolute right-0 top-2 w-[42%] animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: "0.2s", animationFillMode: "both", transform: "rotate(3deg)" }}>
          <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">📞</span>
              <span className="text-[10px] font-bold text-red-400">Verpasste Anrufe</span>
            </div>
            <div className="space-y-1.5">
              {[
                { name: "Fr. Weber", time: "vor 2 Std.", count: 3 },
                { name: "Steuerberater", time: "vor 4 Std.", count: 1 },
                { name: "+49 621 …", time: "gestern", count: 2 },
              ].map((call, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/80 font-medium">{call.name}</p>
                    <p className="text-[8px] text-[#6a6e76]">{call.time}</p>
                  </div>
                  <span className="rounded-full bg-red-500/30 px-1.5 py-0.5 text-[8px] font-bold text-red-300">
                    {call.count}×
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chaotic Excel — bottom, full width */}
        <div className="absolute bottom-0 left-0 right-0 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "0.4s", animationFillMode: "both", transform: "rotate(1deg)" }}>
          <div className="rounded-xl bg-[#1a2010]/60 border border-[#217346]/20 p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">📋</span>
              <span className="text-[10px] font-bold text-[#217346]">Kunden_Liste_FINAL_v3_NEU(2).xlsx</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="px-2 py-1 text-left text-[#6a6e76] font-medium">Name</th>
                    <th className="px-2 py-1 text-left text-[#6a6e76] font-medium">Status</th>
                    <th className="px-2 py-1 text-left text-[#6a6e76] font-medium">Bezahlt?</th>
                    <th className="px-2 py-1 text-left text-[#6a6e76] font-medium">Notiz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-2 py-1 text-white/60">Müller GmbH</td>
                    <td className="px-2 py-1 text-amber-400">offen??</td>
                    <td className="px-2 py-1 text-red-400">NEIN</td>
                    <td className="px-2 py-1 text-[#6a6e76]">nochmal anrufen!</td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-2 py-1 text-white/60">Weber</td>
                    <td className="px-2 py-1 text-[#6a6e76]">???</td>
                    <td className="px-2 py-1 text-white/60">teil</td>
                    <td className="px-2 py-1 text-red-400">DRINGEND</td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-2 py-1 text-white/60">Schmidt & Co</td>
                    <td className="px-2 py-1 text-white/60">fertig glaub</td>
                    <td className="px-2 py-1 text-emerald-400/60">ja</td>
                    <td className="px-2 py-1 text-[#6a6e76]">oder doch nicht?</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Floating stress indicators */}
        <div className="absolute right-2 bottom-[45%] animate-in fade-in duration-300" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
          <div className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-1">
            <span className="text-[9px] text-red-400">🤯 Überfordert</span>
          </div>
        </div>
        <div className="absolute left-[30%] top-[42%] animate-in fade-in duration-300" style={{ animationDelay: "0.8s", animationFillMode: "both" }}>
          <div className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-1">
            <span className="text-[9px] text-amber-400">⏰ 3 Deadlines heute</span>
          </div>
        </div>
      </div>

      {/* Transition — swirl effect */}
      <div className={`absolute inset-6 top-14 flex items-center justify-center transition-all duration-500 ${
        phase === "transition"
          ? "opacity-100 scale-100"
          : "opacity-0 scale-110 pointer-events-none"
      }`}>
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-[#FFC62C]/40 border-t-[#FFC62C] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>
      </div>

      {/* Order phase — clean dashboard */}
      <div className={`absolute inset-6 top-14 transition-all duration-700 ${
        phase === "order"
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}>
        <div className="space-y-3 pt-2">
          {ORDER_ITEMS.map((item, i) => (
            <div
              key={i}
              className="animate-in slide-in-from-bottom-2 fade-in"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className="text-xs text-emerald-400 font-bold">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFC62C] to-emerald-400 rounded-full transition-all ease-out [transition-duration:2000ms]"
                      style={{ width: phase === "order" ? `${item.progress}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom summary */}
        <div className="absolute bottom-0 left-0 right-0 rounded-xl bg-emerald-400/[0.08] border border-emerald-400/20 p-3 text-center">
          <p className="text-xs text-emerald-400 font-semibold">
            ✨ Alles läuft — auch ohne Sie. In 48h online.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { config: abConfig, trackImpression, trackConversion } = useABTest("hero-messaging");

  // Determine which variant to show based on A/B config
  const variant = useMemo(() => {
    const variantId = abConfig.variantId;
    if (variantId) {
      return HERO_VARIANTS.find((v) => v.id === variantId) ?? HERO_VARIANTS[0];
    }
    // Default: first variant (automatisierung)
    return HERO_VARIANTS[0];
  }, [abConfig.variantId]);

  useEffect(() => {
    trackImpression();
  }, [trackImpression]);

  return (
    <section className="relative flex items-start pt-[130px] md:pt-[140px] lg:pt-[130px] pb-[125px] overflow-hidden bg-[#111318]">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Radial gold glow - top right */}
        <div className="absolute -top-[300px] -right-[200px] h-[800px] w-[800px] rounded-full bg-[#FFC62C]/[0.07] blur-[150px]" />
        {/* Radial gold glow - bottom left */}
        <div className="absolute -bottom-[200px] -left-[100px] h-[500px] w-[500px] rounded-full bg-[#FFC62C]/[0.04] blur-[120px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,198,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,198,44,0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left: Text content */}
          <div className="max-w-2xl">
            {/* Status badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FFC62C]/20 bg-[#FFC62C]/[0.08] px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFC62C] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFC62C]" />
              </span>
              <span className="text-sm font-medium text-[#FFC62C]">
                Verfügbar für neue Projekte
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
              {variant.headline}
            </h1>

            <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              {variant.subheadline}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_30px_rgba(255,198,44,0.3)] hover:shadow-[0_0_40px_rgba(255,198,44,0.4)] transition-all"
              >
                <Link href={variant.primaryCta.href} onClick={() => trackConversion("hero_cta_click")}>
                  {variant.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-14 px-8 text-base text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
              >
                <Link href={variant.secondaryCta.href}>
                  {variant.secondaryCta.label}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trust signals inline */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#6a6e76]">
              <span>✓ Keine technischen Kenntnisse nötig</span>
              <span>✓ Alles aus einer Hand</span>
              <span>✓ Kostenlos & unverbindlich</span>
            </div>
          </div>

          {/* Right: Animated "Chaos → Order" illustration */}
          <div className="hidden lg:block">
            <div className="relative">
              <ChaosToOrderAnimation />
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-[#1a1d24]/90 backdrop-blur-sm px-5 py-3 shadow-lg text-center">
                <div className="text-2xl font-black text-[#FFC62C]">
                  <AnimatedCounter target={10} suffix="+" />
                </div>
                <div className="text-xs text-[#5a5e66]">Jahre Erfahrung</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1d24]/90 backdrop-blur-sm px-5 py-3 shadow-lg text-center">
                <div className="text-2xl font-black text-[#FFC62C]">
                  {variant.middleStat?.animated ? (
                    <AnimatedCounter target={variant.middleStat.animated.target} suffix={variant.middleStat.animated.suffix} />
                  ) : (
                    variant.middleStat?.value || "Ab 299 €"
                  )}
                </div>
                <div className="text-xs text-[#5a5e66]">{variant.middleStat?.label || "Ihre Lösung"}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1d24]/90 backdrop-blur-sm px-5 py-3 shadow-lg text-center">
                <div className="text-2xl font-black text-[#FFC62C]">24/7</div>
                <div className="text-xs text-[#5a5e66]">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-20 border-t border-white/[0.06] pt-10 space-y-8">
          {/* Logo marquee */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#5a5e66] mb-6 text-center">
              Erfahrung bei
            </p>
            <div className="relative overflow-hidden">
              {/* Fade edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-[#111318] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-[#111318] to-transparent" />
              <div className="flex animate-marquee gap-16 items-center">
                {/* Set 1 */}
                <Image src="/logos/accenture.png" alt="Accenture" width={140} height={36} className="h-7 w-auto shrink-0 opacity-80" />
                <Image src="/logos/allianz.png" alt="Allianz" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="shrink-0 inline-flex items-center rounded-lg bg-white/90 px-2 py-1"><img src="/logos/bamf.svg" alt="BAMF" width={100} height={56} className="h-7 w-auto" /></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/carglass.svg" alt="Carglass" width={120} height={30} className="h-6 w-auto shrink-0 opacity-80 brightness-0 invert" />
                <Image src="/logos/commerzbank.png" alt="Commerzbank" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="shrink-0 inline-flex items-center rounded-lg bg-white/90 px-2 py-1"><img src="/logos/gls.svg" alt="GLS" width={100} height={40} className="h-7 w-auto" /></span>
                <Image src="/logos/sap.png" alt="SAP" width={80} height={40} className="h-8 w-auto shrink-0 opacity-80" />
                <Image src="/logos/volkswagen.png" alt="Volkswagen" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
                {/* Set 2 (duplicate for seamless loop) */}
                <Image src="/logos/accenture.png" alt="Accenture" width={140} height={36} className="h-7 w-auto shrink-0 opacity-80" />
                <Image src="/logos/allianz.png" alt="Allianz" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="shrink-0 inline-flex items-center rounded-lg bg-white/90 px-2 py-1"><img src="/logos/bamf.svg" alt="BAMF" width={100} height={56} className="h-7 w-auto" /></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/carglass.svg" alt="Carglass" width={120} height={30} className="h-6 w-auto shrink-0 opacity-80 brightness-0 invert" />
                <Image src="/logos/commerzbank.png" alt="Commerzbank" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="shrink-0 inline-flex items-center rounded-lg bg-white/90 px-2 py-1"><img src="/logos/gls.svg" alt="GLS" width={100} height={40} className="h-7 w-auto" /></span>
                <Image src="/logos/sap.png" alt="SAP" width={80} height={40} className="h-8 w-auto shrink-0 opacity-80" />
                <Image src="/logos/volkswagen.png" alt="Volkswagen" width={44} height={44} className="h-9 w-auto shrink-0 opacity-80" />
              </div>
            </div>
          </div>

          {/* Certification badges */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#5a5e66] mb-5 text-center">
              Zertifizierungen
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
                <Image src="/badges/ckad.png" alt="CKAD" width={40} height={40} className="rounded-md" />
                <div>
                  <div className="text-xs font-bold text-white leading-none">CKAD</div>
                  <div className="text-[10px] text-[#6a6e76] leading-tight mt-0.5">Kubernetes Developer</div>
                </div>
              </div>
              <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
                <Image src="/badges/istqb-ctfl.png" alt="ISTQB CTFL" width={40} height={40} className="rounded-md" />
                <div>
                  <div className="text-xs font-bold text-white leading-none">ISTQB CTFL</div>
                  <div className="text-[10px] text-[#6a6e76] leading-tight mt-0.5">Foundation Level</div>
                </div>
              </div>
              <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
                <Image src="/badges/istqb-tae.png" alt="ISTQB CTAL-TAE" width={40} height={40} className="rounded-md" />
                <div>
                  <div className="text-xs font-bold text-white leading-none">ISTQB CTAL-TAE</div>
                  <div className="text-[10px] text-[#6a6e76] leading-tight mt-0.5">Test Automation Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
