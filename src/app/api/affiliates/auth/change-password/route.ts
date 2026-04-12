import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";
import { verifyPassword, hashPassword } from "@/lib/affiliate/password";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
});

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAffiliate();
  } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: session.affiliateId },
    select: { passwordHash: true },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Konto nicht gefunden" }, { status: 404 });
  }

  const currentValid = await verifyPassword(parsed.data.currentPassword, affiliate.passwordHash);
  if (!currentValid) {
    return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 401 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.affiliate.update({
    where: { id: session.affiliateId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true });
}
