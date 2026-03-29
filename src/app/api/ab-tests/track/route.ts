import { NextRequest, NextResponse } from "next/server";
import { addEvent, getTestById } from "@/lib/ab-tests";

/**
 * POST /api/ab-tests/track
 *
 * Public endpoint (no auth). Receives impression and conversion events.
 * Deduplicates impressions per visitor + test combination.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, variantId, visitorId, type, conversionType, page } = body;

    // Validate required fields
    if (!testId || !variantId || !visitorId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: testId, variantId, visitorId, type" },
        { status: 400 }
      );
    }

    if (type !== "impression" && type !== "conversion") {
      return NextResponse.json(
        { error: "type must be 'impression' or 'conversion'" },
        { status: 400 }
      );
    }

    // Verify test exists and is running
    const test = await getTestById(testId);
    if (!test || test.status !== "running") {
      return new NextResponse(null, { status: 204 }); // Silently ignore
    }

    // Verify variant belongs to this test
    if (!test.variants.some((v) => v.id === variantId)) {
      return new NextResponse(null, { status: 204 }); // Silently ignore
    }

    const event = {
      id: crypto.randomUUID(),
      testId,
      variantId,
      visitorId,
      type: type as "impression" | "conversion",
      conversionType: conversionType || undefined,
      page: page || undefined,
      createdAt: new Date().toISOString(),
    };

    await addEvent(event);

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
