import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { verifyUsername, verifyPassword } from "@/lib/auth/password";
import { isTOTPConfigured } from "@/lib/auth/totp";
import { checkRateLimit, getRateLimitResetSeconds } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    const resetIn = getRateLimitResetSeconds(ip);
    return NextResponse.json(
      { error: `Zu viele Anmeldeversuche. Bitte in ${Math.ceil(resetIn / 60)} Minuten erneut versuchen.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { username, password } = body as { username: string; password: string };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Benutzername und Passwort erforderlich" },
      { status: 400 }
    );
  }

  // Verify credentials
  const usernameValid = verifyUsername(username);
  const passwordValid = await verifyPassword(password);

  if (!usernameValid || !passwordValid) {
    return NextResponse.json(
      { error: "Ungültige Anmeldedaten" },
      { status: 401 }
    );
  }

  // Create partial session (password OK, 2FA pending)
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.isLoggedIn = true;
  session.is2FAVerified = false;
  session.username = username;
  session.loginAt = Date.now();
  session.lastActivity = Date.now();
  await session.save();

  // Determine next step
  const totpConfigured = isTOTPConfigured();

  return NextResponse.json({
    success: true,
    next: totpConfigured ? "totp" : "setup-2fa",
  });
}
