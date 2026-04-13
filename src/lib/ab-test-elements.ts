/**
 * Registry of UI elements that can be A/B tested.
 *
 * Each entry defines:
 * - label: Human-readable name shown in admin UI
 * - component: Source file (for reference)
 * - fields: Configurable fields that the component reads via useABTest()
 */

export interface ABTestField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ABTestElement {
  label: string;
  component: string;
  fields: ABTestField[];
}

export const AB_TEST_ELEMENTS: Record<string, ABTestElement> = {
  "hero-messaging": {
    label: "Hero — Messaging & Variante",
    component: "Hero.tsx",
    fields: [
      {
        key: "variantId",
        label: "Hero-Variante",
        type: "select",
        options: [
          { value: "automatisierung", label: "Automatisieren Sie Ihre Abläufe" },
          { value: "sorglos", label: "Von der Idee zum Produkt — ohne Technik-Stress" },
          { value: "ohne-aufwand", label: "Ohne Aufwand. Mehr Zeit für das, was zählt" },
        ],
      },
      {
        key: "heading",
        label: "Headline (überschreibt Variante)",
        type: "text",
        placeholder: "Leer lassen = Variante wird verwendet",
      },
    ],
  },
  "urgency-section": {
    label: "Urgency Section — Variante",
    component: "UrgencySection.tsx",
    fields: [
      {
        key: "variantId",
        label: "Urgency-Variante",
        type: "select",
        options: [
          { value: "security", label: "Job-Sicherheit — Was, wenn KI Ihren Job übernimmt?" },
          { value: "pain", label: "Alltags-Chaos — Excel, WhatsApp, Zettel" },
          { value: "fomo", label: "FOMO — Ihre Konkurrenz baut bereits" },
        ],
      },
    ],
  },
  "hero-animation": {
    label: "Hero — Animation Variante",
    component: "Hero.tsx",
    fields: [
      {
        key: "variantId",
        label: "Chaos-Variante",
        type: "select",
        options: [
          { value: "alltag", label: "Alltags-Chaos — WhatsApp, Anrufe, Excel" },
          { value: "zettel", label: "Zettelwirtschaft — Notizen, E-Mails, Kalender" },
          { value: "tools", label: "Tool-Chaos — App-Overload, veraltete Daten" },
        ],
      },
    ],
  },
  "hero-cta": {
    label: "Hero — CTA-Button Text",
    component: "Hero.tsx",
    fields: [
      {
        key: "ctaLabel",
        label: "CTA-Button Text",
        type: "text",
        placeholder: "z.B. Projekt starten",
      },
    ],
  },
  "cta-section": {
    label: "CTA Section — Headline & Subtext",
    component: "CTASection.tsx",
    fields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "z.B. Bereit, Ihr Projekt zu starten?",
      },
      {
        key: "subtext",
        label: "Subtext",
        type: "textarea",
        placeholder: "z.B. In 48 Stunden von der Idee zur fertigen Lösung.",
      },
    ],
  },
  "trust-quote": {
    label: "Trust Signals — Founder-Zitat",
    component: "TrustSignals.tsx",
    fields: [
      {
        key: "quote",
        label: "Zitat",
        type: "textarea",
        placeholder: "z.B. Mein Anspruch: Qualität ohne Kompromisse.",
      },
    ],
  },
  "offers-grid": {
    label: "Angebote — Sektions-Headline",
    component: "OffersGrid.tsx",
    fields: [
      {
        key: "heading",
        label: "Sektions-Headline",
        type: "text",
        placeholder: "z.B. Was ich für Sie baue",
      },
    ],
  },
} as const;

export type ABTestElementKey = keyof typeof AB_TEST_ELEMENTS;
