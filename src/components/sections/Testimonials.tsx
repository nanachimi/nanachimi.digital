"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Vom Onboarding über interne Abstimmungen bis hin zu Zinsberechnungen und Reporting — Credilis deckt alles ab, was wir als Genossenschaft brauchen. So eine umfangreiche Lösung hätte ich nicht in dieser Geschwindigkeit erwartet.",
    name: "Bertrand Foller",
    role: "Vorstand",
    company: "Golden Lions e.G.",
    image: "",
  },
  {
    quote:
      "Ich verkaufe jetzt Extensions direkt über meine Website — vorher lief alles nur über WhatsApp. Ich habe null technische Kenntnisse und trotzdem war mein Shop in zwei Tagen online. Meine Kundinnen sind begeistert.",
    name: "Amelie Charlemagne",
    role: "Inhaberin",
    company: "Amelia Hair",
    image: "",
  },
  {
    quote:
      "Für eine Kanzlei ist Datenschutz nicht verhandelbar. Cerebra überzeugt uns durch absolute Zuverlässigkeit, volle DSGVO-Konformität und eine Sicherheitsarchitektur, der wir bedenkenlos unsere Mandantendaten anvertrauen.",
    name: "Jan Polner",
    role: "Partner",
    company: "Kanzlei Polner GmbH & Co. KG",
    image: "",
  },
];

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FFC62C] to-[#e6b228] text-[#111318] font-bold text-2xl shadow-lg shadow-[#FFC62C]/20">
      {initials}
    </div>
  );
}

function TestimonialAvatar({
  image,
  name,
}: {
  image: string;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError || !image) {
    return <AvatarPlaceholder name={name} />;
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-3 border-[#FFC62C]/40 shadow-lg shadow-[#FFC62C]/10">
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export function Testimonials() {
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
      className="relative py-24 md:py-32 bg-[#0d0f13] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-[#FFC62C]/[0.02] blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
            Kundenstimmen
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            Was Kunden sagen
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#8B8F97]">
            Vertrauen entsteht durch Ergebnisse — nicht durch Versprechen.
          </p>
        </div>

        {/* Testimonial cards — photo on top, centered */}
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className={`group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center transition-all duration-700 hover:border-[#FFC62C]/20 hover:bg-white/[0.05] hover:-translate-y-1 ${
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: visible ? `${300 + i * 150}ms` : "0ms",
              }}
            >
              {/* Photo centered */}
              <div className="flex justify-center mb-6">
                <TestimonialAvatar
                  image={testimonial.image}
                  name={testimonial.name}
                />
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-0.5 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-[#FFC62C] text-[#FFC62C]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#8B8F97] leading-relaxed text-base italic min-h-[80px]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="font-bold text-white">
                  {testimonial.name}
                </p>
                <p className="text-sm text-[#6a6e76] mt-1">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
