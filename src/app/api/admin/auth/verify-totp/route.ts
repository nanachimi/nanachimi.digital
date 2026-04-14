import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { verifyTOTP } from "@/lib/auth/totp";
import { totpLimiter } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = (headerStore.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0]!.trim();

  if (!totpLimiter.check(ip)) {
    const retryAfter = totpLimiter.getResetSeconds(ip);
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte warten Sie ${retryAfter} Sekunden.` },
      { status: 429 },
    );
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // Must have passed password step
  if (!session.isLoggedIn) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "6-stelliger Code erforderlich" },
      { status: 400 }
    );
  }

  if (!(await verifyTOTP(code))) {
    return NextResponse.json(
      { error: "Ungültiger Code. Bitte erneut versuchen." },
      { status: 401 }
    );
  }

  // Upgrade to fully authenticated session
  session.is2FAVerified = true;
  session.lastActivity = Date.now();
  await session.save();

  return NextResponse.json({ success: true });
}
