import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicApiLimiter } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!publicApiLimiter.check(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, code } = body as { phone?: string; code?: string };

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Telefonnummer und Code sind erforderlich." },
        { status: 400 }
      );
    }

    // Find the latest verification record for this phone
    const record = await prisma.phoneVerification.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Kein Verifizierungscode gefunden. Bitte fordern Sie einen neuen Code an." },
        { status: 404 }
      );
    }

    // Check max attempts
    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Zu viele Versuche. Bitte fordern Sie einen neuen Code an." },
        { status: 429 }
      );
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "Code abgelaufen. Bitte fordern Sie einen neuen Code an." },
        { status: 410 }
      );
    }

    // Check code match
    if (record.code !== code) {
      // Increment attempts
      await prisma.phoneVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: "Ungültiger Code. Bitte versuchen Sie es erneut." },
        { status: 400 }
      );
    }

    // Success — mark verified
    await prisma.phoneVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
