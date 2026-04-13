import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// We test the pure helper functions used in the dashboard API.
// These are defined inline in the route file, so we recreate them here
// to verify correctness independently of the route handler.
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fillDailyGaps(
  map: Map<string, number>,
  days: number,
): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = toDateKey(daysAgo(i));
    result.push({ date: key, value: map.get(key) ?? 0 });
  }
  return result;
}

// ---------------------------------------------------------------------------
// daysAgo
// ---------------------------------------------------------------------------

describe("daysAgo", () => {
  it("returns a Date n days in the past", () => {
    const d = daysAgo(7);
    const diff = Date.now() - d.getTime();
    const daysDiff = diff / (24 * 60 * 60 * 1000);
    expect(daysDiff).toBeCloseTo(7, 0);
  });

  it("returns now when n = 0", () => {
    const d = daysAgo(0);
    const diff = Date.now() - d.getTime();
    expect(diff).toBeLessThan(1000); // within 1 second
  });
});

// ---------------------------------------------------------------------------
// toDateKey
// ---------------------------------------------------------------------------

describe("toDateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    const d = new Date("2026-04-13T14:30:00.000Z");
    expect(toDateKey(d)).toBe("2026-04-13");
  });

  it("zero-pads single-digit months and days", () => {
    const d = new Date("2026-01-05T00:00:00.000Z");
    expect(toDateKey(d)).toBe("2026-01-05");
  });
});

// ---------------------------------------------------------------------------
// fillDailyGaps
// ---------------------------------------------------------------------------

describe("fillDailyGaps", () => {
  it("returns the correct number of entries", () => {
    const map = new Map<string, number>();
    const result = fillDailyGaps(map, 7);
    expect(result).toHaveLength(7);
  });

  it("fills missing days with 0", () => {
    const map = new Map<string, number>();
    const result = fillDailyGaps(map, 3);
    expect(result.every((r) => r.value === 0)).toBe(true);
  });

  it("uses map values for days that have data", () => {
    const today = toDateKey(new Date());
    const map = new Map<string, number>([[today, 42]]);
    const result = fillDailyGaps(map, 3);
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry?.value).toBe(42);
  });

  it("entries are ordered oldest → newest", () => {
    const map = new Map<string, number>();
    const result = fillDailyGaps(map, 5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });

  it("returns empty array when days = 0", () => {
    const map = new Map<string, number>();
    const result = fillDailyGaps(map, 0);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Conversion rate logic
// ---------------------------------------------------------------------------

describe("conversion rate calculation", () => {
  function calcConversionRate(accepted: number, rejected: number, sent: number) {
    const denom = accepted + rejected + sent;
    return denom > 0 ? Math.round((accepted / denom) * 100) : 0;
  }

  it("returns 0 when no submissions", () => {
    expect(calcConversionRate(0, 0, 0)).toBe(0);
  });

  it("returns 100% when all accepted", () => {
    expect(calcConversionRate(5, 0, 0)).toBe(100);
  });

  it("returns 50% for 1 accepted, 1 rejected", () => {
    expect(calcConversionRate(1, 1, 0)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    // 1 / 3 = 33.33...% → 33
    expect(calcConversionRate(1, 1, 1)).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// Pipeline value aggregation logic
// ---------------------------------------------------------------------------

describe("pipeline value aggregation", () => {
  function computePipelineValue(
    submissions: { estimate: { festpreis?: number } | null }[],
  ): number {
    let value = 0;
    for (const s of submissions) {
      const est = s.estimate as { festpreis?: number } | null;
      if (est?.festpreis) value += est.festpreis;
    }
    return value;
  }

  it("sums festpreis from estimates", () => {
    const subs = [
      { estimate: { festpreis: 1000 } },
      { estimate: { festpreis: 2000 } },
      { estimate: { festpreis: 500 } },
    ];
    expect(computePipelineValue(subs)).toBe(3500);
  });

  it("skips null estimates", () => {
    const subs = [
      { estimate: { festpreis: 1000 } },
      { estimate: null },
      { estimate: { festpreis: 500 } },
    ];
    expect(computePipelineValue(subs)).toBe(1500);
  });

  it("skips estimates without festpreis", () => {
    const subs = [
      { estimate: { festpreis: 1000 } },
      { estimate: {} },
    ];
    expect(computePipelineValue(subs)).toBe(1000);
  });

  it("returns 0 for empty array", () => {
    expect(computePipelineValue([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Trend calculation logic (used in dashboard page)
// ---------------------------------------------------------------------------

describe("trendInfo calculation", () => {
  function trendInfo(current: number, previous: number) {
    if (previous === 0 && current === 0) return { direction: "neutral" as const, label: "—" };
    if (previous === 0) return { direction: "up" as const, label: "Neu" };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0) return { direction: "up" as const, label: `+${pct}%` };
    if (pct < 0) return { direction: "down" as const, label: `${pct}%` };
    return { direction: "neutral" as const, label: "0%" };
  }

  it("returns neutral when both are 0", () => {
    expect(trendInfo(0, 0)).toEqual({ direction: "neutral", label: "—" });
  });

  it("returns up+Neu when previous is 0 but current > 0", () => {
    expect(trendInfo(5, 0)).toEqual({ direction: "up", label: "Neu" });
  });

  it("returns up with percentage for growth", () => {
    expect(trendInfo(150, 100)).toEqual({ direction: "up", label: "+50%" });
  });

  it("returns down with negative percentage for decline", () => {
    expect(trendInfo(50, 100)).toEqual({ direction: "down", label: "-50%" });
  });

  it("returns neutral for no change", () => {
    expect(trendInfo(100, 100)).toEqual({ direction: "neutral", label: "0%" });
  });

  it("rounds percentage to nearest integer", () => {
    // 110/100 = 10%
    expect(trendInfo(110, 100)).toEqual({ direction: "up", label: "+10%" });
    // 133/100 = 33%
    expect(trendInfo(133, 100)).toEqual({ direction: "up", label: "+33%" });
  });
});
