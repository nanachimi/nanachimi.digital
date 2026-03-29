import { Service } from "@/lib/types";

export const services: Service[] = [
  {
    slug: "48h-mvp",
    title: "48h Go-Live",
    shortDescription:
      "Für ausgewählte MVP-Projekte mit klarem Scope: Von der finalen Abstimmung bis zum Deployment in 48 Stunden.",
    icon: "Zap",
    idealFor:
      "Gründer und Unternehmen mit einer klaren App-Idee und definiertem Scope, die schnell am Markt sein wollen.",
    features: [
      "Klarer Scope vorab definiert",
      "Entwicklung in 48 Stunden",
      "Deployment auf Ihrer Infrastruktur",
      "Basis-Monitoring inklusive",
      "Produktionsreifer Code",
      "Dokumentation der Architektur",
    ],
    process: [
      {
        step: 1,
        title: "Scope bestätigen",
        description:
          "Gemeinsame finale Abstimmung der Anforderungen und des Funktionsumfangs.",
      },
      {
        step: 2,
        title: "Entwicklung",
        description:
          "Konzentrierte Umsetzung mit modernem Tech-Stack und bewährten Patterns.",
      },
      {
        step: 3,
        title: "Go-Live",
        description:
          "Deployment, Basis-Tests und Übergabe — Ihre App ist live.",
      },
    ],
  },
  {
    slug: "app-entwicklung",
    title: "Individuelle App-Entwicklung",
    shortDescription:
      "Maßgeschneiderte Web- und Mobile-Apps mit modernem Tech-Stack. Iterativ, transparent und produktionsreif.",
    icon: "Code",
    idealFor:
      "KMU und Unternehmen, die eine professionelle Web- oder Mobile-App entwickeln lassen wollen — von einfachen Tools bis zu komplexen Plattformen.",
    features: [
      "Discovery und Anforderungsanalyse",
      "UX/UI-Design (oder Integration bestehender Designs)",
      "Iterative Entwicklung mit regelmäßigen Updates",
      "Automatisierte Tests und Qualitätssicherung",
      "Deployment und Go-Live Begleitung",
      "Technische Dokumentation",
    ],
    process: [
      {
        step: 1,
        title: "Discovery",
        description:
          "Anforderungen verstehen, Scope definieren, Architektur planen.",
      },
      {
        step: 2,
        title: "Design & Prototyping",
        description:
          "UI/UX-Entwürfe und interaktive Prototypen zur Abstimmung.",
      },
      {
        step: 3,
        title: "Entwicklung",
        description:
          "Iterative Umsetzung in Sprints mit regelmäßigem Feedback.",
      },
      {
        step: 4,
        title: "Testing & Go-Live",
        description:
          "Qualitätssicherung, Performance-Optimierung und Deployment.",
      },
    ],
  },
  {
    slug: "betrieb-und-wartung",
    title: "Betrieb, Monitoring & Wartung",
    shortDescription:
      "Laufender Betrieb, Monitoring, Updates und Support für bestehende oder neu entwickelte Apps.",
    icon: "Shield",
    idealFor:
      "Unternehmen mit bestehenden oder neu entwickelten Apps, die zuverlässigen Betrieb und kontinuierliche Verbesserung brauchen.",
    features: [
      "24/7 Uptime-Monitoring",
      "Incident Response und Fehlerbehebung",
      "Regelmäßige Security-Updates",
      "Performance-Optimierung",
      "Backup-Management",
      "Monatliche Status-Reports",
    ],
    process: [
      {
        step: 1,
        title: "Analyse",
        description:
          "Bestandsaufnahme der Infrastruktur und Identifikation von Risiken.",
      },
      {
        step: 2,
        title: "Setup",
        description:
          "Monitoring, Alerting und Backup-Systeme einrichten.",
      },
      {
        step: 3,
        title: "Laufender Betrieb",
        description:
          "Kontinuierliches Monitoring, proaktive Wartung und schnelle Reaktion bei Problemen.",
      },
    ],
  },
];
