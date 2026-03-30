import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { verifyTOTP } from "@/lib/auth/totp";

export async function POST(request: Request) {
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
  const { code } = body as { code: string };

  if (!code || code.length !== 6) {
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
