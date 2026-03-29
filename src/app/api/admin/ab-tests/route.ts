import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAllTests,
  createTest,
  getTestStats,
  type ABTest,
} from "@/lib/ab-tests";

/**
 * GET /api/admin/ab-tests
 * List all A/B tests with aggregated stats.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tests = await getAllTests();
  const testsWithStats = await Promise.all(tests.map(async (test) => ({
    ...test,
    stats: await getTestStats(test.id),
  })));

  return NextResponse.json(testsWithStats);
}

/**
 * POST /api/admin/ab-tests
 * Create a new A/B test.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, targetElement, variants } = body;

    if (!name || !targetElement || !variants || variants.length < 2) {
      return NextResponse.json(
        {
          error:
            "Required: name, targetElement, variants (min. 2)",
        },
        { status: 400 }
      );
    }

    // Validate weights sum to 100
    const totalWeight = variants.reduce(
      (sum: number, v: { weight: number }) => sum + v.weight,
      0
    );
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: "Variant weights must sum to 100" },
        { status: 400 }
      );
    }

    const test: ABTest = {
      id: crypto.randomUUID(),
      name,
      targetElement,
      status: "draft",
      variants: variants.map(
        (v: { id?: string; label: string; config: Record<string, string>; weight: number }) => ({
          id: v.id || crypto.randomUUID().slice(0, 8),
          label: v.label,
          config: v.config || {},
          weight: v.weight,
        })
      ),
      createdAt: new Date().toISOString(),
    };

    await createTest(test);

    return NextResponse.json(test, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
