import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Code, Shield, Check, CreditCard, Sparkles } from "lucide-react";
import { services } from "@/data/services";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Digitale Lösungen für Gründer & Kleingewerbe — Leistungen",
  description:
    "Von der Idee bis zum laufenden Betrieb — alles aus einer Hand. In 48h online, individuelle Lösungen ab 299 € und laufende Betreuung.",
};

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Code,
  Shield,
};

const colorAccents = [
  "from-[#FFC62C] to-[#FF9500]",
  "from-[#3B82F6] to-[#1D4ED8]",
  "from-[#10B981] to-[#059669]",
];

export default function LeistungenPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
          <div className="absolute -bottom-[100px] -left-[100px] h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Leistungen
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
              Von der Idee zum
              <br />
              <span className="text-[#FFC62C]">fertigen Produkt.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              Sie haben eine Idee — wir machen den Rest. Planung, Umsetzung,
              Start und Betreuung. Alles aus einer Hand, ohne Technik-Stress.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-[#6a6e76]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FFC62C]" />
                Ab 299 € möglich
              </span>
              <span>·</span>
              <span>In 48h online</span>
              <span>·</span>
              <span>Keine Vorkenntnisse nötig</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {services.map((service, i) => {
              const Icon = iconMap[service.icon] || Zap;
              return (
                <Link
                  key={service.slug}
                  href={`/leistungen/${service.slug}`}
                  className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Top gradient accent */}
                  <div
                    className={`h-1.5 bg-gradient-to-r ${colorAccents[i]}`}
                  />

                  <div className="p-8">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFC62C]/10 text-[#FFC62C]">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold">{service.title}</h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      {service.shortDescription}
                    </p>

                    {/* Features preview */}
                    <ul className="mt-6 space-y-2.5">
                      {service.features.slice(0, 4).map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex items-center text-sm font-semibold text-[#393E46] transition-colors group-hover:text-[#FFC62C]">
                      Mehr erfahren
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why us — rewritten for target audience */}
      <section className="py-20 md:py-28 bg-[#f8f8f6]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Warum wir
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Damit Sie sich auf Ihr Vorhaben konzentrieren können
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              {
                title: "Kein Technik-Stress",
                desc: "Sie brauchen keine technischen Kenntnisse. Beschreiben Sie Ihr Vorhaben in einfachen Worten — wir kümmern uns um alles Andere.",
              },
              {
                title: "10+ Jahre Erfahrung",
                desc: "Bewährte Methoden aus Projekten für Allianz, SAP, Commerzbank und BAMF — jetzt für Ihr Vorhaben.",
              },
              {
                title: "Transparente Preise",
                desc: "Ab 299 € möglich. Kein Überraschungs-Aufschlag, keine versteckten Kosten. Sie wissen vorher, was es kostet.",
              },
              {
                title: "Ein Ansprechpartner für alles",
                desc: "Von der Idee bis zum laufenden Betrieb — Sie haben eine Person, die sich um alles kümmert. Kein Agentur-Chaos.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#FFC62C]" />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Preise
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Klare Preise. Keine Überraschungen.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Sie wissen vorher, was Ihre Lösung kostet. Sofortzahlung? 12% Rabatt.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {/* 48h Go-Live */}
            <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-[#FFC62C] to-[#FF9500]" />
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC62C]/10">
                  <Zap className="h-6 w-6 text-[#FFC62C]" />
                </div>
                <h3 className="text-lg font-bold">In 48h online</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">ab 299 €</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Für klare Vorhaben mit definiertem Umfang
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">In 48 Stunden live</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">1 Monat Betreuung inkl.</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Sofort nutzbar für Ihre Kunden</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Individuelle Lösung */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFC62C] bg-white shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8]" />
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-[#FFC62C] px-3 py-1 text-xs font-bold text-[#111318]">
                  Am beliebtesten
                </span>
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Code className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold">Individuelle Lösung</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">ab 999 €</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maßgeschneidert nach Ihren Wünschen
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Planung & Umsetzung komplett</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Sie sehen regelmäßig den Fortschritt</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Go-Live + 1 Monat Betreuung</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Betrieb & Wartung */}
            <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-[#10B981] to-[#059669]" />
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold">Laufende Betreuung</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">ab 29 €</span>
                  <span className="text-base text-muted-foreground">/Monat</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Wir kümmern uns — Sie nicht
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Rund-um-die-Uhr-Überwachung</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Sicherheit & Updates automatisch</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Schnelle Hilfe bei Problemen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Discount + Payment terms */}
          <div className="mx-auto mt-10 max-w-2xl space-y-4">
            <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-emerald-900">Sofort-Zahler-Rabatt</h4>
                  <p className="mt-1 text-sm text-emerald-700">
                    <strong>12% Rabatt</strong> bei Sofortzahlung des Gesamtbetrags.
                    <strong> 5% Rabatt</strong> bei 50% Anzahlung.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-[#f8f8f6] p-5">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC62C]" />
                <div>
                  <h4 className="font-bold">Zahlungsbedingungen</h4>
                  <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">15 %</strong> vor Projektstart</span>
                    <span><strong className="text-foreground">35 %</strong> nach erster Lieferung</span>
                    <span><strong className="text-foreground">50 %</strong> vor Go-Live</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Zahlung per Stripe (Kreditkarte, SEPA) oder Überweisung. 1 Monat Betreuung nach Go-Live inklusive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
