import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAggregatedStats } from "@/lib/analytics";
export const dynamic = "force-dynamic";

export async function GET() {
  // Check admin auth
  const cookieStore = await cookies();
  const session = cookieStore.get("ncd-admin-session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getAggregatedStats();
  return NextResponse.json(stats);
}
