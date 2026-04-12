import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AffiliateSessionData, affiliateSessionOptions, isAffiliateSessionValid } from "@/lib/auth/affiliate-session";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<AffiliateSessionData>(cookieStore, affiliateSessionOptions);

  if (!session.isLoggedIn || !isAffiliateSessionValid(session)) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    handle: session.handle,
    affiliateId: session.affiliateId,
  });
}
