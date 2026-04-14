import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { generateEnrollment, verifyTOTPWithSecret, isTOTPConfigured, saveTOTPSecret } from "@/lib/auth/totp";

// GET: Generate new TOTP secret + QR code for enrollment
export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (await isTOTPConfigured()) {
    return NextResponse.json(
      { error: "2FA ist bereits konfiguriert" },
      { status: 400 }
    );
  }

  const enrollment = await generateEnrollment();

  return NextResponse.json({
    secret: enrollment.secret,
    qrDataUrl: enrollment.qrDataUrl,
  });
}

// POST: Confirm enrollment by verifying a code against the new secret
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await request.json();
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const secret = typeof body?.secret === "string" ? body.secret.trim() : "";

  if (!code || !/^\d{6}$/.test(code) || !secret) {
    return NextResponse.json(
      { error: "Code und Secret erforderlich" },
      { status: 400 }
    );
  }

  if (!verifyTOTPWithSecret(code, secret)) {
    return NextResponse.json(
      { error: "Ungültiger Code. Bitte erneut versuchen." },
      { status: 401 }
    );
  }

  // Save the TOTP secret to the database
  await saveTOTPSecret(secret);

  // Mark session as fully authenticated for this setup session
  session.is2FAVerified = true;
  session.lastActivity = Date.now();
  await session.save();

  return NextResponse.json({
    success: true,
    message: "2FA erfolgreich eingerichtet.",
  });
}
