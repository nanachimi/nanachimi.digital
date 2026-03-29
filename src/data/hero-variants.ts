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
      "Damit Ihr Geschäft auch ohne Sie läuft. Wir bauen Ihre digitale Lösung — von der Idee bis zum laufenden Betrieb. Alles aus einer Hand.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
  {
    id: "sorglos",
    headline: "Von der Idee zum fertigen Produkt — ohne Technik-Stress.",
    subheadline:
      "Beschreiben Sie Ihr Vorhaben in wenigen Minuten. Wir übernehmen Planung, Umsetzung, Start und Support. Komplett.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
  {
    id: "ohne-aufwand",
    headline: "Ohne Aufwand. Mehr Zeit für das, was zählt.",
    subheadline:
      "Wir bauen Ihre digitale Lösung — von der ersten Idee bis zum laufenden Betrieb. Ein Ansprechpartner für alles. Ohne Technik-Stress.",
    primaryCta: { label: "In 48h online — jetzt starten", href: "/onboarding" },
    secondaryCta: { label: "Kostenlos beraten lassen", href: "/kontakt" },
  },
];
