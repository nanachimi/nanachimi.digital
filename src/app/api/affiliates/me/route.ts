import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";

export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: session.affiliateId },
    select: {
      id: true,
      name: true,
      email: true,
      handle: true,
      commissionRate: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          referrals: true,
          commissions: true,
          promoCodes: true,
        },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Konto nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    ...affiliate,
    commissionRate: Number(affiliate.commissionRate),
  });
}
