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
  type: "text" | "textarea";
  placeholder?: string;
}

export interface ABTestElement {
  label: string;
  component: string;
  fields: ABTestField[];
}

export const AB_TEST_ELEMENTS: Record<string, ABTestElement> = {
  "hero-cta": {
    label: "Hero — CTA & Headline",
    component: "Hero.tsx",
    fields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "z.B. Ihre App. In 48 Stunden live.",
      },
      {
        key: "ctaLabel",
        label: "CTA-Button Text",
        type: "text",
        placeholder: "z.B. Projekt starten",
      },
    ],
  },
  "hero-subheadline": {
    label: "Hero — Subheadline",
    component: "Hero.tsx",
    fields: [
      {
        key: "subheadline",
        label: "Subheadline",
        type: "textarea",
        placeholder:
          "z.B. Web- und Mobile-Apps für Gründer und KMUs — von der Idee bis zum Go-Live.",
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
        placeholder:
          "z.B. In 48 Stunden von der Idee zur fertigen App.",
      },
    ],
  },
  "urgency-heading": {
    label: "Urgency Section — Headline",
    component: "UrgencySection.tsx",
    fields: [
      {
        key: "heading",
        label: "Headline",
        type: "text",
        placeholder:
          "z.B. Ihre Konkurrenz baut bereits. Wann starten Sie?",
      },
      {
        key: "subheading",
        label: "Subheadline",
        type: "textarea",
        placeholder: "z.B. Warum jetzt der richtige Zeitpunkt ist.",
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
    label: "Angebote — Kartentitel & Beschreibung",
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
