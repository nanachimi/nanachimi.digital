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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#111318]">
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

          {/* Right: Visual card stack */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                  <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  <div className="ml-4 h-5 w-48 rounded bg-white/5" />
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-[#8B8F97]">
                    <span className="text-[#FFC62C]">$</span> npx nanachimi deploy --production
                  </div>
                  <div className="text-[#5a5e66]">
                    ✓ Anforderungen validiert
                  </div>
                  <div className="text-[#5a5e66]">
                    ✓ Lösung gebaut und getestet
                  </div>
                  <div className="text-[#5a5e66]">
                    ✓ Deployment auf Hetzner
                  </div>
                  <div className="text-[#5a5e66]">
                    ✓ Monitoring aktiviert
                  </div>
                  <div className="mt-4 text-[#28C840]">
                    ✨ Ihre Lösung ist online — in 47h 23m
                  </div>
                </div>
              </div>

            </div>

            {/* Stats row below terminal card */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-[#1a1d24]/90 backdrop-blur-sm px-5 py-3 shadow-lg text-center">
                <div className="text-2xl font-black text-[#FFC62C]">
                  <AnimatedCounter target={10} suffix="+" />
                </div>
                <div className="text-xs text-[#5a5e66]">Jahre Erfahrung</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1d24]/90 backdrop-blur-sm px-5 py-3 shadow-lg text-center">
                <div className="text-2xl font-black text-[#FFC62C]">
                  <AnimatedCounter target={5} />
                </div>
                <div className="text-xs text-[#5a5e66]">Produkte gebaut</div>
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
