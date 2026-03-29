export interface HeroVariant {
  id: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export const HERO_VARIANTS: HeroVariant[] = [
  {
    id: "automatisierung",
    headline: "Automatisieren Sie Ihre Abläufe.",
    subheadline:
      "Sie sind Gründer, Selbstständig oder führen ein Kleingewerbe? Wir bauen Ihre digitale Lösung — von der Idee bis zum laufenden Betrieb. Damit Sie sich auf Ihr Vorhaben konzentrieren können.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
  {
    id: "sorglos",
    headline: "Von der Idee zum fertigen Produkt — ohne Technik-Stress.",
    subheadline:
      "Für Gründer und Kleingewerbe, die keine Zeit für Technik haben. Beschreiben Sie Ihr Vorhaben in wenigen Minuten — wir übernehmen Planung, Umsetzung, Start und Support. Komplett.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
  {
    id: "ohne-aufwand",
    headline: "Ohne Aufwand. Mehr Zeit für das, was zählt.",
    subheadline:
      "Als Gründer oder Selbstständiger haben Sie genug um die Ohren. Wir kümmern uns um Ihre digitale Lösung — von der Idee bis zum Betrieb. Ein Ansprechpartner für alles.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
];
