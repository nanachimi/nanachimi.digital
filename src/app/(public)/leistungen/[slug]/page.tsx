import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Zap, Code, Shield, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Code,
  Shield,
};

const techStacks: Record<string, { category: string; items: string[] }[]> = {
  "48h-mvp": [
    { category: "Frontend", items: ["Next.js", "React", "Tailwind CSS"] },
    { category: "Backend", items: ["Node.js", "Spring Boot", "PostgreSQL"] },
    { category: "Deployment", items: ["Docker", "Hetzner", "GitHub Actions"] },
  ],
  "individuelle-loesung": [
    { category: "Frontend", items: ["Next.js", "React", "Angular", "Tailwind CSS"] },
    { category: "Backend", items: ["Java", "Spring Boot", "Node.js", "Python"] },
    { category: "Datenbanken", items: ["PostgreSQL", "MongoDB", "Neo4J"] },
    { category: "Infrastruktur", items: ["Docker", "Kubernetes", "Hetzner", "CI/CD"] },
  ],
  "betrieb-und-wartung": [
    { category: "Überwachung", items: ["Uptime-Checks", "Alerting", "Logs"] },
    { category: "Infrastruktur", items: ["Docker", "Kubernetes", "Hetzner"] },
    { category: "Sicherheit", items: ["SSL/TLS", "Backups", "Security-Patches"] },
  ],
};

const targetGroups: Record<string, string[]> = {
  "48h-mvp": [
    "Gründer mit einer klaren Idee",
    "Selbstständige, die schnell starten wollen",
    "Kleingewerbe mit definiertem Vorhaben",
    "Projekte, die nicht warten können",
  ],
  "individuelle-loesung": [
    "Kleingewerbe mit größeren Vorhaben",
    "Gründer, die eine maßgeschneiderte Lösung brauchen",
    "Vorhaben, die Schritt für Schritt umgesetzt werden",
    "Alle, die sich nicht um Technik kümmern wollen",
  ],
  "betrieb-und-wartung": [
    "Kleingewerbe mit bestehender Lösung",
    "Gründer ohne Zeit für Technik-Pflege",
    "Lösungen, die zuverlässig laufen müssen",
    "Projekte nach dem Go-Live",
  ],
};

const pricing: Record<string, { price: string; note: string }> = {
  "48h-mvp": { price: "ab 299 €", note: "Festpreis nach Abstimmung" },
  "individuelle-loesung": { price: "ab 999 €", note: "Maßgeschneidert nach Ihren Wünschen" },
  "betrieb-und-wartung": { price: "ab 29 €/Monat", note: "1. Monat im Festpreis inklusive" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.title} — Leistungen`,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const Icon = iconMap[service.icon] || Zap;
  const stack = techStacks[slug] || [];
  const targets = targetGroups[slug] || [];
  const price = pricing[slug];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <Link
            href="/leistungen"
            className="inline-flex items-center gap-2 text-sm text-[#8B8F97] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle Leistungen
          </Link>
          <div className="flex items-start gap-6">
            <div className="hidden md:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FFC62C]/10">
              <Icon className="h-8 w-8 text-[#FFC62C]" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl !leading-[1.05]">
                {service.title}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#8B8F97]">
                {service.shortDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features + Pricing */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-[1fr_340px]">
            {/* Left: Features */}
            <div>
              <h2 className="text-2xl font-bold">Was ist enthalten?</h2>
              <ul className="mt-6 space-y-3">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFC62C]/10">
                      <Check className="h-3 w-3 text-[#FFC62C]" />
                    </div>
                    <span className="text-muted-foreground leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Process / Timeline */}
              <h2 className="mt-14 text-2xl font-bold">Typischer Ablauf</h2>
              <div className="mt-6 space-y-0">
                {service.process.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC62C] text-sm font-bold text-[#111318]">
                        {step.step}
                      </div>
                      {i < service.process.length - 1 && (
                        <div className="w-px flex-1 bg-[#FFC62C]/20 my-1" />
                      )}
                    </div>
                    <div className="pb-8">
                      <h3 className="font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              {stack.length > 0 && (
                <>
                  <h2 className="mt-10 text-2xl font-bold">
                    Technologie-Stack
                  </h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {stack.map((group) => (
                      <div
                        key={group.category}
                        className="rounded-xl border p-4"
                      >
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {group.category}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border bg-[#f8f8f6] px-3 py-1 text-xs font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              {/* Pricing card */}
              {price && (
                <div className="rounded-xl border-2 border-[#FFC62C] bg-[#111318] p-6 text-center">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FFC62C]">
                    Preis
                  </h3>
                  <div className="mt-3 text-3xl font-black text-white">
                    {price.price}
                  </div>
                  <p className="mt-2 text-sm text-[#8B8F97]">{price.note}</p>
                  <Button
                    asChild
                    size="lg"
                    className="mt-6 w-full bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] font-semibold"
                  >
                    <Link href="/onboarding">
                      Projekt starten
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-white/[0.15] text-white hover:bg-white/[0.05]"
                  >
                    <Link href="/kontakt">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Erstgespräch buchen
                    </Link>
                  </Button>
                </div>
              )}

              {/* Target group */}
              {targets.length > 0 && (
                <div className="rounded-xl border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-[#FFC62C]" />
                    <h3 className="font-bold">Für wen?</h3>
                  </div>
                  <ul className="space-y-2">
                    {targets.map((target, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC62C]" />
                        {target}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zahlungsbedingungen */}
              <div className="rounded-xl border bg-[#f8f8f6] p-5">
                <h4 className="text-sm font-bold">Zahlungsbedingungen</h4>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">15 %</strong> vor Projektstart</p>
                  <p><strong className="text-foreground">35 %</strong> nach MVP-Lieferung</p>
                  <p><strong className="text-foreground">50 %</strong> vor Go-Live / Übergabe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
