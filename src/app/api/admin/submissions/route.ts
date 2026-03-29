import { NextResponse } from "next/server";
import { getAllSubmissions } from "@/lib/submissions";
import { requireAdmin } from "@/lib/auth/require-admin";

// GET /api/admin/submissions — list all submissions
export async function GET() {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const submissions = await getAllSubmissions();
  return NextResponse.json(submissions);
}
