import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();

  // Only allow updating known fields
  const allowed = [
    "companyName", "ownerName", "street", "plz", "city", "country",
    "email", "phone", "website", "steuernummer", "ustIdNr", "vatRate",
    "iban", "bic", "bankName", "kontoinhaber",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key];
    }
  }

  const updated = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json(updated);
}
