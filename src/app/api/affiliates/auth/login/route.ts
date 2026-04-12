import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AffiliateSessionData, affiliateSessionOptions } from "@/lib/auth/affiliate-session";
import { verifyPassword } from "@/lib/affiliate/password";
import { loginLimiter } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!loginLimiter.check(`aff:${ip}`)) {
    const resetIn = loginLimiter.getResetSeconds(`aff:${ip}`);
    return NextResponse.json(
      { error: `Zu viele Anmeldeversuche. Bitte in ${Math.ceil(resetIn / 60)} Minuten erneut versuchen.` },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort erforderlich" },
      { status: 400 },
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, handle: true, passwordHash: true, status: true },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, affiliate.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 });
  }

  if (affiliate.status !== "active") {
    return NextResponse.json(
      { error: "Ihr Konto ist nicht aktiv. Bitte kontaktieren Sie den Support." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const session = await getIronSession<AffiliateSessionData>(cookieStore, affiliateSessionOptions);

  session.isLoggedIn = true;
  session.affiliateId = affiliate.id;
  session.email = affiliate.email;
  session.handle = affiliate.handle;
  session.loginAt = Date.now();
  session.lastActivity = Date.now();
  await session.save();

  return NextResponse.json({ success: true });
}
