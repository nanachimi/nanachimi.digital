import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Default Pricing Config (mirrors DEFAULT_PRICING_CONFIG from pricing-config.ts)
// ---------------------------------------------------------------------------

const DEFAULT_PRICING_CONFIG = {
  weeklyRates: {
    "48h": 1000,
    "1-2wochen": 700,
    "1monat": 600,
    flexibel: 495,
  },
  featureDays: {
    "Anmeldung & Benutzerkonten": 1,
    Verwaltungsbereich: 2,
    "Online bezahlen": 2.5,
    "E-Mail-Benachrichtigungen": 0.5,
    "Push-Nachrichten aufs Handy": 1,
    "Chat-Funktion": 2.5,
    "Suche & Filter": 1,
    "Dateien hochladen": 0.5,
    "Anbindung an andere Systeme": 1.5,
    "Mehrere Sprachen": 1,
    "Auswertungen & Statistiken": 2,
    "Unterschiedliche Zugriffsrechte": 1.5,
    // Legacy keys (backwards compat)
    "Benutzer-Authentifizierung": 1,
    "Admin-Dashboard": 2,
    Zahlungsintegration: 2.5,
    "Push-Benachrichtigungen": 1,
    "Echtzeit-Chat": 2.5,
    "Datei-Upload": 0.5,
    "API-Integration": 1.5,
    Mehrsprachigkeit: 1,
    "Reporting & Analytics": 2,
    "Rollenbasierte Zugriffskontrolle": 1.5,
  },
  bwPackages: [
    { months: 3, pricePerMonth: 69 },
    { months: 6, pricePerMonth: 49 },
    { months: 12, pricePerMonth: 29 },
  ],
  bwIncludedMonths: 1,
  zahlungsbedingungen: [
    { prozent: 15, label: "Vor Projektstart" },
    { prozent: 35, label: "Nach MVP-Lieferung" },
    { prozent: 50, label: "Vor Go-Live / Vor Übergabe" },
  ],
  riskThresholds: {
    lowMaxFeatures: 5,
    mediumMaxFeatures: 8,
  },
  demand: {
    maxCapacity: 3,
    maxSurcharge: 0.2,
    adminOverride: 0,
  },
  autoAngebotLimits: {
    minPrice: 299,
    maxPrice: 4999,
  },
  baseSetupDays: 2,
};

// ---------------------------------------------------------------------------
// Default Availability (Mon-Thu 9-12 + 14-16, Fri 9-13)
// ---------------------------------------------------------------------------

const DEFAULT_AVAILABILITY = [
  // Montag
  { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { dayOfWeek: 1, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  // Dienstag
  { dayOfWeek: 2, startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { dayOfWeek: 2, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  // Mittwoch
  { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { dayOfWeek: 3, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  // Donnerstag
  { dayOfWeek: 4, startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { dayOfWeek: 4, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
  // Freitag
  { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 13, endMinute: 0 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Pricing Config
  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    update: { config: DEFAULT_PRICING_CONFIG },
    create: { id: "default", config: DEFAULT_PRICING_CONFIG },
  });
  console.log("✅ PricingConfig seeded (id: default)");

  // 2. Availability Slots
  const existingSlots = await prisma.availabilitySlot.count();
  if (existingSlots === 0) {
    await prisma.availabilitySlot.createMany({
      data: DEFAULT_AVAILABILITY,
    });
    console.log(`✅ AvailabilitySlots seeded (${DEFAULT_AVAILABILITY.length} slots)`);
  } else {
    console.log(`⏭️  AvailabilitySlots already exist (${existingSlots} slots), skipping`);
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
