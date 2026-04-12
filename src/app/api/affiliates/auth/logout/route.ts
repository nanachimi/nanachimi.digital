import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AffiliateSessionData, affiliateSessionOptions } from "@/lib/auth/affiliate-session";

export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<AffiliateSessionData>(cookieStore, affiliateSessionOptions);
  session.destroy();
  return NextResponse.json({ success: true });
}
