import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Code, Shield, Check, CreditCard } from "lucide-react";
import { services } from "@/data/services";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "App-Entwicklung & 48h Go-Live — Leistungen",
  description:
    "Von der schnellen MVP-Umsetzung bis zum langfristigen Betrieb — alles aus einer Hand. 48h Go-Live, individuelle App-Entwicklung und Betrieb.",
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
              Von der Idee zur
              <br />
              <span className="text-[#FFC62C]">fertigen App.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
              Von der schnellen MVP-Umsetzung bis zum langfristigen Betrieb —
              alles aus einer Hand. Transparent, professionell, ergebnisorientiert.
            </p>
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

      {/* Comparison / Why us */}
      <section className="py-20 md:py-28 bg-[#f8f8f6]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Warum NanaChimi
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Was uns unterscheidet
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              {
                title: "Ergebnisorientiert",
                desc: "Kein stundenlanges Erstgespräch. Sie teilen Ihre Anforderungen online mit und erhalten direkt eine Einschätzung.",
              },
              {
                title: "Technisch fundiert",
                desc: "10+ Jahre Erfahrung mit verteilten Systemen, Enterprise-Software und Cloud-Infrastruktur.",
              },
              {
                title: "Transparente Preise",
                desc: "Keine versteckten Kosten. Klare Scope-Definition und nachvollziehbare Kalkulation.",
              },
              {
                title: "Alles aus einer Hand",
                desc: "Entwicklung, Deployment, Monitoring und Wartung — Sie haben einen Ansprechpartner für alles.",
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
              Transparente Preisgestaltung
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Keine versteckten Kosten. Sie wissen immer, wofür Sie zahlen.
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
                <h3 className="text-lg font-bold">48h Go-Live</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">ab 1.990 €</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  MVP mit klar definiertem Scope
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Scope-Abstimmung</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Entwicklung in 48h</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Deployment inklusive</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* App-Entwicklung */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFC62C] bg-white shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8]" />
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-[#FFC62C] px-3 py-1 text-xs font-bold text-[#111318]">
                  Beliebt
                </span>
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Code className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold">App-Entwicklung</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">2.990 – 25.000 €</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maßgeschneiderte Web- & Mobile-Apps
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Discovery & Architektur</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Iterative Entwicklung</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Tests & Go-Live Begleitung</span>
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
                <h3 className="text-lg font-bold">Betrieb & Wartung</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black">ab 199 €</span>
                  <span className="text-base text-muted-foreground">/Monat</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ab dem zweiten Jahr
                </p>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">24/7 Monitoring</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Security-Updates</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                    <span className="text-muted-foreground">Incident Response</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Zahlungsbedingungen */}
          <div className="mx-auto mt-10 max-w-2xl rounded-xl border bg-[#f8f8f6] p-6">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC62C]" />
              <div>
                <h4 className="font-bold">Zahlungsbedingungen</h4>
                <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">15 %</strong> vor Projektstart</span>
                  <span><strong className="text-foreground">35 %</strong> nach MVP-Lieferung</span>
                  <span><strong className="text-foreground">50 %</strong> vor Go-Live / Übergabe</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Inkl. 1 Monat Betrieb & Wartung nach Go-Live. Danach optional als Abo: ab 29€/Monat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
