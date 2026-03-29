import { z } from "zod";

export const kontaktdatenSchema = z.object({
  name: z.string().min(2, "Name ist erforderlich"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich"),
  firma: z.string().optional(),
  telefon: z.string().optional(),
});

export const projekttypSchema = z.object({
  projekttyp: z.enum(["web", "mobile", "desktop", "beides", "unsicher"]),
});

export const beschreibungSchema = z.object({
  beschreibung: z.string().min(10, "Bitte beschreiben Sie Ihr Projekt"),
});

export const zielgruppeSchema = z.object({
  zielgruppe: z.string().min(5, "Bitte beschreiben Sie Ihre Zielgruppe"),
});

export const funktionenSchema = z.object({
  funktionen: z.array(z.string()).min(1, "Bitte wählen Sie mindestens eine Funktion"),
});

export const rolleAppSchema = z.object({
  rolle: z.string().min(1),
  appTyp: z.array(z.enum(["web", "mobile", "desktop"])).min(1, "Bitte wählen Sie mindestens einen App-Typ"),
  beschreibung: z.string().optional(),
});

export const nutzerrollenSchema = z.object({
  rollenAnzahl: z.enum(["1", "2", "3+"]),
  rollenBeschreibung: z.string().optional(),
  appStruktur: z.enum(["shared", "separate"]).optional(),
  rollenApps: z.array(rolleAppSchema).optional(),
});

export const designSchema = z.object({
  designLevel: z.enum(["standard", "individuell", "premium"]),
});

export const brandingSchema = z.object({
  markenname: z.string().max(100).optional(),
  domain: z.string().max(253).optional(),
  brandingInfo: z.string().max(2000).optional(),
  fileIds: z.array(z.string()).max(5).optional(),
});

export const zeitrahmenSchema = z.object({
  zeitrahmenMvp: z.enum(["48h", "1-2wochen", "1monat", "flexibel"]),
  zeitrahmenFinal: z.enum(["1monat", "2-3monate", "6monate", "laufend"]),
});

export const budgetSchema = z.object({
  budget: z.enum(["unter-399", "399-1000", "1000-5000", "5000-10000", "10000-plus", "unsicher"]),
});

export const betriebSchema = z.object({
  betriebUndWartung: z.enum(["ja", "teilweise", "nein", "unsicher", "ohne"]),
  betriebLaufzeit: z.enum(["3", "6", "12"]).optional(),
});

export const abschlussSchema = z.object({
  naechsterSchritt: z.enum(["call", "angebot"]),
  zusatzinfo: z.string().optional(),
});

export const fullOnboardingSchema = z.object({
  ...kontaktdatenSchema.shape,
  ...projekttypSchema.shape,
  ...beschreibungSchema.shape,
  ...zielgruppeSchema.shape,
  ...funktionenSchema.shape,
  ...nutzerrollenSchema.shape,
  ...designSchema.shape,
  ...brandingSchema.shape,
  ...zeitrahmenSchema.shape,
  ...budgetSchema.shape,
  ...betriebSchema.shape,
  ...abschlussSchema.shape,
});

export type OnboardingData = z.infer<typeof fullOnboardingSchema>;

export const FEATURE_OPTIONS = [
  "Anmeldung & Benutzerkonten",
  "Verwaltungsbereich",
  "Online bezahlen",
  "E-Mail-Benachrichtigungen",
  "Push-Nachrichten aufs Handy",
  "Chat-Funktion",
  "Suche & Filter",
  "Dateien hochladen",
  "Anbindung an andere Systeme",
  "Mehrere Sprachen",
  "Auswertungen & Statistiken",
  "Unterschiedliche Zugriffsrechte",
] as const;

/** Max custom features a user can add */
export const MAX_CUSTOM_FEATURES = 10;

/** Max characters per custom feature */
export const MAX_CUSTOM_FEATURE_LENGTH = 35;

/** Prefix for custom features in the funktionen array */
export const CUSTOM_FEATURE_PREFIX = "custom:";

// Mapping from user-friendly labels to internal estimation keys
export const FEATURE_LABEL_TO_KEY: Record<string, string> = {
  "Anmeldung & Benutzerkonten": "Benutzer-Authentifizierung",
  "Verwaltungsbereich": "Admin-Dashboard",
  "Online bezahlen": "Zahlungsintegration",
  "E-Mail-Benachrichtigungen": "E-Mail-Benachrichtigungen",
  "Push-Nachrichten aufs Handy": "Push-Benachrichtigungen",
  "Chat-Funktion": "Echtzeit-Chat",
  "Suche & Filter": "Suche & Filter",
  "Dateien hochladen": "Datei-Upload / Download",
  "Anbindung an andere Systeme": "API-Integration",
  "Mehrere Sprachen": "Mehrsprachigkeit",
  "Auswertungen & Statistiken": "Reporting & Analytics",
  "Unterschiedliche Zugriffsrechte": "Rollenbasierte Zugriffskontrolle",
};
