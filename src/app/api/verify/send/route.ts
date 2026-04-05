import { NextResponse } from "next/server";
import { isValidPhoneNumber } from "libphonenumber-js";
import { prisma } from "@/lib/db";
import { sendVerificationSms } from "@/lib/twilio";
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
    const { phone } = body as { phone?: string };

    if (!phone || !isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: "Ungültige Telefonnummer." },
        { status: 400 }
      );
    }

    // Rate limit: max 3 SMS per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.phoneVerification.count({
      where: {
        phone,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        {
          error:
            "Zu viele Verifizierungsversuche. Bitte versuchen Sie es in einer Stunde erneut.",
        },
        { status: 429 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create record with 10-minute expiry
    await prisma.phoneVerification.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send SMS
    const sent = await sendVerificationSms(phone, code);
    if (!sent) {
      return NextResponse.json(
        { error: "SMS konnte nicht gesendet werden. Bitte versuchen Sie es erneut." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
