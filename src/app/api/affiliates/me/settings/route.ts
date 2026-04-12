import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth/require-affiliate";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Check email uniqueness if changing
  if (data.email && data.email !== session.email) {
    const emailTaken = await prisma.affiliate.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      select: { id: true },
    });
    if (emailTaken && emailTaken.id !== session.affiliateId) {
      return NextResponse.json({ error: "E-Mail ist bereits vergeben" }, { status: 409 });
    }
  }

  const updated = await prisma.affiliate.update({
    where: { id: session.affiliateId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
    },
    select: { name: true, email: true, handle: true },
  });

  return NextResponse.json(updated);
}
