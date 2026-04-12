export const SITE_CONFIG = {
  name: "NanaChimi Digital",
  url: "https://nanachimi.digital",
  description:
    "Wir bauen Web- und Mobile-Apps, die schnell live gehen. Vom Onboarding bis zur ersten Live-Version in 48 Stunden.",
  contactEmail: "info@nanachimi.digital",
  founder: "Achille Nana Chimi",
  location: "67227 Frankenthal, Deutschland",
} as const;

export const NAV_ITEMS = [
  { label: "Leistungen", href: "/leistungen" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Über mich", href: "/ueber-mich" },
  { label: "Kontakt", href: "/kontakt" },
] as const;

export const FOOTER_SECTIONS = [
  {
    title: "Leistungen",
    links: [
      { label: "In 48h online", href: "/leistungen/48h-mvp" },
      { label: "Individuelle Lösung", href: "/leistungen/individuelle-loesung" },
      { label: "Betrieb & Wartung", href: "/leistungen/betrieb-und-wartung" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Portfolio", href: "/portfolio" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Affiliate-Programm", href: "/affiliates" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
    ],
  },
] as const;

export const ZAHLUNGSBEDINGUNGEN = {
  methode: "Überweisung",
  tranchen: [
    { prozent: 15, label: "Vor Projektstart" },
    { prozent: 35, label: "Nach MVP-Lieferung" },
    { prozent: 50, label: "Vor Go-Live / Vor Übergabe" },
  ],
} as const;

export const BETRIEB_UND_WARTUNG = {
  inkludiertMonate: 1,
  hinweisAbo: "Danach optional als Abo buchbar.",
  pakete: [
    { monate: 3, preisProMonat: 69, label: "3 Monate" },
    { monate: 6, preisProMonat: 49, label: "6 Monate" },
    { monate: 12, preisProMonat: 29, label: "12 Monate" },
  ],
  hinweis:
    "1 Monat Betrieb & Wartung (Monitoring, Updates, Bugfixes) ist im Festpreis enthalten. Danach optional als Abo buchbar: ab 29 €/Monat.",
  hinweisOhne:
    "1 Monat Betrieb & Wartung nach dem Start inklusive. Danach eigenverantwortlicher Betrieb.",
} as const;

export const BANKVERBINDUNG = {
  kontoinhaber: "Achille Nana Chimi",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
} as const;

export const PAYMENT_DISCOUNTS = {
  full:      { percent: 100, discount: 0.12, label: "Sofort komplett zahlen", badgeLabel: "12% Rabatt" },
  half:      { percent: 50,  discount: 0.05, label: "50% Anzahlung",         badgeLabel: "5% Rabatt" },
  tranche_1: { percent: 15,  discount: 0,    label: "15% Anzahlung",         badgeLabel: "" },
} as const;

export type PaymentType = keyof typeof PAYMENT_DISCOUNTS;

/** Hard floor to protect margin when stacking promo + payment discounts. */
export const MIN_FESTPREIS_EUR = 299;

/**
 * Cap total combined discount (promo + payment-time) at 50 % to protect
 * margins against aggressive campaigns combined with Vollzahlung.
 *
 * Must match promo.ts `MAX_TOTAL_DISCOUNT` — kept as a local const so
 * constants.ts doesn't pull the promo lib into edge runtime.
 */
export const MAX_TOTAL_DISCOUNT_PCT = 0.5;

/**
 * Calculate the three payment options for an Angebot, optionally stacking
 * an additional promo code discount on top of the payment-time discount.
 *
 * Stacking rule (validated with founder): **additive** — a 25 % promo plus
 * the 12 % Vollzahlung bonus yields 37 %, clamped at MAX_TOTAL_DISCOUNT_PCT.
 * The final price is also clamped at MIN_FESTPREIS_EUR so we never sell
 * below the floor regardless of stacking.
 */
export function calculatePaymentOptions(
  festpreis: number,
  promoDiscount: number = 0,
) {
  const safePromo = Math.max(0, Math.min(promoDiscount, MAX_TOTAL_DISCOUNT_PCT));
  return Object.entries(PAYMENT_DISCOUNTS).map(([type, config]) => {
    const rawTotalPct = safePromo + config.discount;
    const totalPct = Math.min(rawTotalPct, MAX_TOTAL_DISCOUNT_PCT);
    const clamped = rawTotalPct > MAX_TOTAL_DISCOUNT_PCT;

    // Clamp final price at the minimum festpreis floor.
    const discountedTotal = Math.max(
      Math.round(festpreis * (1 - totalPct)),
      MIN_FESTPREIS_EUR,
    );
    const amount = Math.round(discountedTotal * (config.percent / 100));
    const discountAmount = festpreis - discountedTotal;
    // Breakdown (informational only — displayed separately in AngebotPricing).
    const promoAmount = Math.round(festpreis * safePromo);
    const paymentDiscountAmount = discountAmount - promoAmount;

    return {
      type: type as PaymentType,
      amount,
      discount: discountAmount,
      discountPercent: Math.round(totalPct * 100),
      promoDiscount: safePromo,
      promoDiscountAmount: promoAmount,
      paymentDiscountPercent: Math.round(config.discount * 100),
      paymentDiscountAmount,
      clamped,
      label: config.label,
      badgeLabel: config.badgeLabel,
      festpreisOriginal: festpreis,
      festpreisDiscounted: discountedTotal,
    };
  });
}

export const TRUST_SIGNALS = [
  { label: "Ex-Accenture", description: "Consultant" },
  { label: "Ex-SAP", description: "Engineer" },
  { label: "ISTQB", description: "Foundation + Automation" },
  { label: "CKAD", description: "Kubernetes zertifiziert" },
  { label: "MBA", description: "FOM (laufend)" },
  { label: "10+ Jahre", description: "Verteilte Systeme" },
] as const;
