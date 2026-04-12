import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function run() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Clean up old data
  await prisma.promoCode.deleteMany({ where: { campaignId: { not: undefined } } });
  await prisma.campaign.deleteMany({});
  await prisma.affiliate.deleteMany({ where: { handle: "sysys35" } });

  const aff = await prisma.affiliate.create({
    data: {
      email: "sysys@example.com",
      passwordHash: "scrypt$16384$8$1$aGVsbG8=$c7RwxEiGebDVI09Ui2GUMFzfz7PGm4T5UM9oe61lUnwtc6NHyJrgtBHFOdGIYnPoKxzgsejvdpU0cz+DIV/MQg==", // password: test1234
      name: "Sysys Test",
      handle: "sysys35",
      commissionRate: "0.15",
      status: "active",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: "Test Startup Q2 2026",
      campaignCode: "Startup2026",
      discountPercent: "0.25",
      description: "Testkampagne",
      active: true,
    },
  });

  // Admin code = campaignCode lowercased = "startup2026"
  const adminCode = await prisma.promoCode.create({
    data: {
      code: "startup2026",
      campaignId: campaign.id,
      affiliateId: null,
      discountPercent: "0.25",
      active: true,
    },
  });

  // Affiliate code = handle + percentInt = "sysys3525"
  const affCode = await prisma.promoCode.create({
    data: {
      code: "sysys3525",
      campaignId: campaign.id,
      affiliateId: aff.id,
      discountPercent: "0.25",
      active: true,
    },
  });

  console.log("SEED OK", { affId: aff.id, campId: campaign.id, adminCode: adminCode.code, affCode: affCode.code });
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
