import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { rating, comment, submissionId } = await req.json();

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Ungültige Bewertung" }, { status: 400 });
    }

    await prisma.onboardingRating.create({
      data: {
        rating,
        comment: comment || null,
        submissionId: submissionId || null,
      },
    });

    console.log(
      `[RATING] Onboarding-Bewertung: ${rating}/5${comment ? ` — "${comment}"` : ""}${submissionId ? ` (Anfrage: ${submissionId})` : ""}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RATING] Error:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
