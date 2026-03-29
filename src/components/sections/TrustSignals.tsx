"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";

export function TrustSignals() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#111318] overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#FFC62C]/[0.04] blur-[150px]" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
            Mein Weg
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            Vertrauen entsteht nicht auf dem Papier.
            <br />
            <span className="text-[#FFC62C]">Sondern durch den Weg.</span>
          </h2>
        </div>

        {/* Quote block */}
        <div
          className={`max-w-3xl mx-auto transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="rounded-2xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Founder photo */}
              <div className="shrink-0">
                <div className="relative h-36 w-36 md:h-44 md:w-44 rounded-full overflow-hidden border-4 border-[#FFC62C]/30 shadow-2xl shadow-[#FFC62C]/10">
                  <Image
                    src="/founder.jpg"
                    alt="Gründer von nanachimi.digital"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Quote text */}
              <div className="flex-1 text-center md:text-left">
                <Quote className="h-8 w-8 text-[#FFC62C]/40 mb-4 mx-auto md:mx-0 rotate-180" />
                <p className="text-lg md:text-xl font-medium text-white leading-relaxed italic">
                  Ich kam 2008 allein nach Deutschland. Ohne Familie, ohne Geld,
                  ohne Kontakte. Ich habe mein Studium selbst finanziert, erfolgreich
                  absolviert und weiß, was es bedeutet, seinen eigenen Weg zu finden.
                </p>
                <p className="text-lg md:text-xl font-medium text-white leading-relaxed italic mt-4">
                  Wenn ich Ihre App baue, steckt dieselbe Leidenschaft und
                  Entschlossenheit drin.
                </p>
                <p className="mt-6 text-sm text-[#8B8F97] font-semibold">
                  — Gründer, nanachimi.digital
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-12 transition-all duration-700 delay-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-3 rounded-full bg-[#FFC62C] px-8 py-4 text-base font-bold text-[#111318] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#FFC62C]/20"
            >
              Projekt starten
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/kontakt"
              className="group inline-flex items-center gap-3 rounded-full border border-white/[0.15] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/[0.05] hover:border-white/[0.25]"
            >
              Erstgespräch buchen
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#6a6e76]">
            Kostenlose Ersteinschätzung in unter 3 Minuten
          </p>
        </div>
      </div>
    </section>
  );
}
