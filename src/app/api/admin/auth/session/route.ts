import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions, isSessionValid } from "@/lib/auth/session";

// GET: Check current session status (for client-side auth checks)
export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    return NextResponse.json({ authenticated: false });
  }

  if (!isSessionValid(session)) {
    session.destroy();
    return NextResponse.json({ authenticated: false, reason: "expired" });
  }

  return NextResponse.json({
    authenticated: session.is2FAVerified,
    username: session.username,
    partialAuth: session.isLoggedIn && !session.is2FAVerified,
  });
}
