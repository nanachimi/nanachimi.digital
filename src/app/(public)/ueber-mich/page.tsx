import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Briefcase,
  Award,
  Shield,
  GraduationCap,
  MapPin,
  Mail,
  Heart,
  Globe,
  Code2,
  TestTube,
  Database,
  Container,
} from "lucide-react";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Achille Nana Chimi — 10+ Jahre App-Entwicklung",
  description:
    "Achille Nana Chimi — Full-Stack-Entwickler mit 10+ Jahren Erfahrung. Ex-Accenture, Ex-SAP, CKAD & ISTQB zertifiziert.",
};

const timeline = [
  {
    period: "Seit 2024",
    role: "Gründer & Lead Developer",
    company: "nanachimi.digital",
    description:
      "Eigene Produkte und Kundenprojekte. Full-Stack-Entwicklung, Cloud-Infrastruktur, End-to-End-Verantwortung. Von der Idee bis zum Betrieb — alles aus einer Hand.",
  },
  {
    period: "2023 – 2024",
    role: "Fullstack Lead Engineer",
    company: "Statistisches Landesamt Rheinland-Pfalz",
    description:
      "Alleinverantwortung für Requirements-Engineering, Microservice-Design, CI/CD-Pipelines und Kubernetes-Deployment. Spring Boot, Oracle, Angular.",
  },
  {
    period: "2022 – 2023",
    role: "Fullstack Lead Engineer",
    company: "GLS IT Services",
    description:
      "Entwicklung von Kafka-Streams-Applikationen und RESTful Webservices für Track & Trace und Paketumleitungen. AWS, PostgreSQL, Camunda.",
  },
  {
    period: "2021 – 2022",
    role: "Senior Java Backend Engineer",
    company: "BAMF",
    description:
      "Entwicklung der DigA-Plattform (Digitale Akte) für Dokumentenmanagement. Microservices, Kubernetes, Spring Webflux in internationalem Team.",
  },
  {
    period: "2017 – 2019",
    role: "Java Lead Developer",
    company: "SAP SE",
    description:
      "Festanstellung bei SAP. Microservices für SAP Concur (Spend Tax & Travel Allowance). Zwei Spot-Awards erhalten, als SAP-Catalyst nominiert.",
  },
  {
    period: "2015 – 2017",
    role: "Consultant",
    company: "Accenture",
    description:
      "Enterprise-Projekte bei der Commerzbank (Cross-Channel Banking) und Volkswagen (E-Commerce-Plattform). Verteilte Teams, Microservice-Architektur.",
  },
];

const clientLogos = [
  "BAMF",
  "SAP",
  "Accenture",
  "Commerzbank",
  "Volkswagen",
  "Allianz",
  "Carglass",
  "GLS",
];

const certifications = [
  {
    icon: Shield,
    label: "CKAD",
    detail: "Certified Kubernetes Application Developer",
    year: "2023",
  },
  {
    icon: Award,
    label: "ISTQB",
    detail: "Test Automation Engineer + Foundation Level",
    year: "2023",
  },
  {
    icon: GraduationCap,
    label: "B.Sc.",
    detail: "Medizinische Informatik — TH Mannheim",
    year: "2015",
  },
];

const skillCategories = [
  {
    icon: Code2,
    label: "Sprachen & Frameworks",
    skills: [
      "Java",
      "TypeScript",
      "Python",
      "Next.js",
      "React",
      "Angular",
      "Spring Boot",
      "Node.js",
    ],
  },
  {
    icon: Container,
    label: "DevOps & Cloud",
    skills: [
      "Docker",
      "Kubernetes",
      "AWS",
      "Hetzner",
      "Jenkins",
      "GitHub Actions",
      "Terraform",
      "Openshift",
    ],
  },
  {
    icon: Database,
    label: "Datenbanken",
    skills: ["PostgreSQL", "MongoDB", "Oracle", "MySQL", "Prisma"],
  },
  {
    icon: TestTube,
    label: "Testing & Qualität",
    skills: [
      "JUnit 5",
      "Postman",
      "Selenium",
      "Cucumber",
      "TestNG",
      "RestAssured",
    ],
  },
];

export default function UeberMichPage() {
  return (
    <>
      {/* Hero with Photo */}
      <section className="relative overflow-hidden bg-[#111318] py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[#FFC62C]/[0.06] blur-[120px]" />
          <div className="absolute -bottom-[100px] -left-[100px] h-[400px] w-[400px] rounded-full bg-[#FFC62C]/[0.03] blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
            {/* Photo — mobile first */}
            <div className="shrink-0 md:order-2">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-[#FFC62C]/30 to-[#FFC62C]/5 blur-md" />
                <Image
                  src="/founder.jpg"
                  alt="Achille Nana Chimi"
                  width={320}
                  height={320}
                  className="relative rounded-2xl object-cover shadow-2xl w-[240px] h-[240px] md:w-[320px] md:h-[320px]"
                  priority
                />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left md:order-1">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
                Über mich
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl !leading-[1.05]">
                Achille Nana Chimi
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8B8F97] md:text-xl">
                Verheiratet, Vater von zwei Kindern, Mannheimer aus
                Leidenschaft. Ich baue seit über 10 Jahren verteilte
                Systeme für Unternehmen wie SAP, Accenture, die
                Commerzbank und das BAMF.
              </p>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#8B8F97]">
                Heute helfe ich Gründern und KMUs, ihre App-Ideen
                schnell und professionell umzusetzen — vom ersten
                Gespräch bis zum laufenden Betrieb.
              </p>

              {/* Quick facts */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#6a6e76]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#FFC62C]" />
                  Mannheim
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-[#FFC62C]" />
                  Verheiratet, 2 Kinder
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#FFC62C]" />
                  Deutsch, Englisch, Französisch
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-[#FFC62C]" />
                  info@nanachimi.digital
                </span>
              </div>

              <div className="mt-10 flex gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base font-bold bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl shadow-[0_0_30px_rgba(255,198,44,0.3)]"
                >
                  <Link href="/onboarding">
                    Projekt starten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-14 px-8 text-base text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
                >
                  <Link href="/kontakt">Kontakt aufnehmen</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Personal Story */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Mein Weg
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Vom Informatik-Studenten zum Unternehmer
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Aufgewachsen in Kamerun, kam ich nach Deutschland, um an der{" "}
                <strong className="text-foreground">
                  Technischen Hochschule Mannheim
                </strong>{" "}
                (ehem. Hochschule Mannheim) Medizinische Informatik zu studieren.
                Der Studiengang hat mich gelehrt, komplexe Systeme zu verstehen — nicht
                nur technisch, sondern auch aus der Perspektive der Nutzer.
              </p>
              <p>
                Nach dem Studium startete ich bei{" "}
                <strong className="text-foreground">Accenture</strong>, wo ich als
                Consultant Enterprise-Projekte für die Commerzbank und Volkswagen
                umsetzte. Danach wechselte ich zu{" "}
                <strong className="text-foreground">SAP</strong> als Festangestellter
                und leitete dort Microservice-Teams für SAP Concur — mit zwei
                Spot-Awards und einer Nominierung als SAP-Catalyst.
              </p>
              <p>
                In den darauffolgenden Jahren arbeitete ich für Unternehmen wie
                Allianz, Carglass, GLS und das Bundesamt für Migration und
                Flüchtlinge (BAMF). Überall mit dem gleichen Fokus: robuste,
                skalierbare Systeme bauen, die im echten Betrieb funktionieren.
              </p>
              <p>
                Heute bin ich verheiratet und stolzer Vater von zwei Kindern — meine
                Tochter wird im Juli 6 und mein Sohn wird im November 3. Die Familie
                hat mir beigebracht, was wirklich zählt:{" "}
                <strong className="text-foreground">
                  Ergebnisse liefern, nicht Meetings führen.
                </strong>
              </p>
              <p>
                Deshalb habe ich{" "}
                <strong className="text-foreground">nanachimi.digital</strong>{" "}
                gegründet: um Gründern und kleinen Unternehmen dabei zu helfen,
                ihre App-Ideen schnell und professionell umzusetzen — ohne
                Overhead, ohne unnötige Komplexität, ohne endlose Abstimmungsrunden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="py-20 md:py-28 bg-[#111318]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Werdegang
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              10+ Jahre Erfahrung
            </h2>
            <p className="mt-4 text-[#8B8F97] max-w-2xl mx-auto">
              Von Enterprise-Beratung bei DAX-Konzernen bis zur eigenen
              Produktentwicklung — immer mit Fokus auf Ergebnis und Qualität.
            </p>
          </div>

          {/* Client Logos */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-4">
            {clientLogos.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#8B8F97]"
              >
                {name}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {timeline.map((item, i) => (
              <div
                key={i}
                className="flex gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC62C]/10">
                  <Briefcase className="h-6 w-6 text-[#FFC62C]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {item.role}
                    </h3>
                    <span className="text-sm text-[#8B8F97]">
                      @ {item.company}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-1 text-xs border-white/20 text-[#8B8F97]"
                  >
                    {item.period}
                  </Badge>
                  <p className="mt-3 text-[#8B8F97] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Education */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Qualifikationen
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Zertifizierungen & Ausbildung
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-3">
            {certifications.map((cert) => (
              <div
                key={cert.label}
                className="rounded-xl border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFC62C]/10">
                  <cert.icon className="h-7 w-7 text-[#FFC62C]" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{cert.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {cert.detail}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {cert.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Skills */}
      <section className="py-20 md:py-28 bg-[#111318]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FFC62C]">
              Technologien
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Tech-Stack
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {skillCategories.map((cat) => (
              <div
                key={cat.label}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC62C]/10">
                    <cat.icon className="h-5 w-5 text-[#FFC62C]" />
                  </div>
                  <h3 className="font-bold text-white">{cat.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="px-3 py-1.5 text-xs border-white/10 text-[#8B8F97] hover:bg-[#FFC62C]/10 hover:border-[#FFC62C]/30 hover:text-white transition-colors cursor-default"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Zusammenarbeiten?"
        subtext="Ich freue mich auf Ihr Projekt. Teilen Sie mir Ihre Anforderungen mit und erhalten Sie direkt eine Einschätzung."
      />
    </>
  );
}
