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
  // Montag: 8-9, 12:25-12:55
  { dayOfWeek: 1, startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 },
  { dayOfWeek: 1, startHour: 12, startMinute: 25, endHour: 12, endMinute: 55 },
  // Dienstag: 8-9, 17:00-17:30
  { dayOfWeek: 2, startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 },
  { dayOfWeek: 2, startHour: 17, startMinute: 0, endHour: 17, endMinute: 30 },
  // Mittwoch: 12:25-12:55
  { dayOfWeek: 3, startHour: 12, startMinute: 25, endHour: 12, endMinute: 55 },
  // Donnerstag: 8-9, 17:00-17:30
  { dayOfWeek: 4, startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 },
  { dayOfWeek: 4, startHour: 17, startMinute: 0, endHour: 17, endMinute: 30 },
  // Freitag: 8-9, 12:25-12:55
  { dayOfWeek: 5, startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 },
  { dayOfWeek: 5, startHour: 12, startMinute: 25, endHour: 12, endMinute: 55 },
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

  // 2. Availability Slots (always replace to stay in sync with seed)
  await prisma.availabilitySlot.deleteMany();
  await prisma.availabilitySlot.createMany({
    data: DEFAULT_AVAILABILITY,
  });
  console.log(`✅ AvailabilitySlots seeded (${DEFAULT_AVAILABILITY.length} slots)`);

  // 3. Booking Settings (30 min meetings, no buffer)
  await prisma.bookingSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", meetingDurationMinutes: 30, bufferMinutes: 0 },
  });
  console.log("✅ BookingSettings seeded (30 min, no buffer)");

  // 4. Default A/B Tests
  const existingTests = await prisma.aBTest.count();
  if (existingTests === 0) {
    // Hero Messaging A/B Test
    await prisma.aBTest.create({
      data: {
        name: "Hero — Messaging-Variante",
        targetElement: "hero-messaging",
        status: "running",
        startedAt: new Date(),
        variants: JSON.parse(JSON.stringify([
          {
            id: "automatisierung",
            label: "Automatisierung (Ab 299 €)",
            config: { variantId: "automatisierung" },
            weight: 34,
          },
          {
            id: "sorglos",
            label: "Sorglos-Paket (Ab 299 €)",
            config: { variantId: "sorglos" },
            weight: 33,
          },
          {
            id: "ohne-aufwand",
            label: "Ohne Aufwand (5 Produkte)",
            config: { variantId: "ohne-aufwand" },
            weight: 33,
          },
        ])),
      },
    });
    console.log("✅ A/B Test 'Hero — Messaging-Variante' seeded (running)");

    // Urgency Section A/B Test
    await prisma.aBTest.create({
      data: {
        name: "Urgency — Section-Variante",
        targetElement: "urgency-section",
        status: "running",
        startedAt: new Date(),
        variants: JSON.parse(JSON.stringify([
          {
            id: "security",
            label: "Job-Sicherheit / KI-Angst",
            config: { variantId: "security" },
            weight: 40,
          },
          {
            id: "pain",
            label: "Alltags-Chaos (Excel, WhatsApp)",
            config: { variantId: "pain" },
            weight: 40,
          },
          {
            id: "fomo",
            label: "FOMO (Konkurrenz baut bereits)",
            config: { variantId: "fomo" },
            weight: 20,
          },
        ])),
      },
    });
    console.log("✅ A/B Test 'Urgency — Section-Variante' seeded (running)");
  } else {
    console.log(`⏭️  A/B Tests already exist (${existingTests} tests), skipping`);
  }

  // 5. Test Affiliate (for E2E tests — idempotent upsert)
  const testAffiliate = await prisma.affiliate.upsert({
    where: { email: "sysys@example.com" },
    update: {},
    create: {
      email: "sysys@example.com",
      // scrypt hash of "test1234"
      passwordHash:
        "scrypt$16384$8$1$aGVsbG8=$c7RwxEiGebDVI09Ui2GUMFzfz7PGm4T5UM9oe61lUnwtc6NHyJrgtBHFOdGIYnPoKxzgsejvdpU0cz+DIV/MQg==",
      name: "Sysys Test",
      handle: "sysys35",
      commissionRate: "0.15",
      status: "active",
    },
  });
  console.log(`✅ Test affiliate seeded (id: ${testAffiliate.id}, handle: sysys35)`);

  // Test campaign + promo codes
  const testCampaign = await prisma.campaign.upsert({
    where: { campaignCode: "Startup2026" },
    update: {},
    create: {
      name: "Test Startup Q2 2026",
      campaignCode: "Startup2026",
      discountPercent: "0.25",
      description: "Testkampagne",
      active: true,
    },
  });
  // Admin promo code (idempotent: skip if code already exists)
  const existingAdminCode = await prisma.promoCode.findFirst({
    where: { code: "startup2026", campaignId: testCampaign.id },
  });
  if (!existingAdminCode) {
    await prisma.promoCode.create({
      data: {
        code: "startup2026",
        campaignId: testCampaign.id,
        affiliateId: null,
        discountPercent: "0.25",
        active: true,
      },
    });
  }
  // Affiliate promo code
  const existingAffCode = await prisma.promoCode.findFirst({
    where: { code: "sysys3525", campaignId: testCampaign.id },
  });
  if (!existingAffCode) {
    await prisma.promoCode.create({
      data: {
        code: "sysys3525",
        campaignId: testCampaign.id,
        affiliateId: testAffiliate.id,
        discountPercent: "0.25",
        active: true,
      },
    });
  }
  console.log("✅ Test campaign + promo codes seeded");

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
