import { prisma } from "@/lib/db";

export interface CompanyInfo {
  companyName: string;
  ownerName: string;
  street: string;
  plz: string;
  city: string;
  country: string;
  email: string;
  phone?: string;
  website: string;
  steuernummer: string;
  ustIdNr?: string;
  vatRate: number; // e.g. 19
  iban: string;
  bic: string;
  bankName: string;
  kontoinhaber: string;
}

/**
 * Load company settings from DB (singleton row).
 * Creates default row if none exists.
 */
export async function getCompanySettings(): Promise<CompanyInfo> {
  const row = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return {
    companyName: row.companyName,
    ownerName: row.ownerName,
    street: row.street,
    plz: row.plz,
    city: row.city,
    country: row.country,
    email: row.email,
    phone: row.phone ?? undefined,
    website: row.website,
    steuernummer: row.steuernummer,
    ustIdNr: row.ustIdNr ?? undefined,
    vatRate: row.vatRate,
    iban: row.iban,
    bic: row.bic,
    bankName: row.bankName,
    kontoinhaber: row.kontoinhaber,
  };
}
