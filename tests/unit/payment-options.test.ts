import { describe, it, expect } from "vitest";
import { calculatePaymentOptions } from "@/lib/constants";

describe("calculatePaymentOptions", () => {
  it("calculates 3 payment options for a given festpreis", () => {
    const options = calculatePaymentOptions(5000);
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.type)).toEqual(["full", "half", "tranche_1"]);
  });

  it("applies 12% discount for full payment", () => {
    const options = calculatePaymentOptions(5000);
    const full = options.find((o) => o.type === "full")!;
    expect(full.festpreisDiscounted).toBe(4400); // 5000 * 0.88
    expect(full.amount).toBe(4400); // 100% of discounted
    expect(full.discount).toBe(600); // 5000 - 4400
    expect(full.discountPercent).toBe(12);
  });

  it("applies 5% discount for half payment", () => {
    const options = calculatePaymentOptions(5000);
    const half = options.find((o) => o.type === "half")!;
    expect(half.festpreisDiscounted).toBe(4750); // 5000 * 0.95
    expect(half.amount).toBe(2375); // 50% of 4750
    expect(half.discount).toBe(250); // 5000 - 4750
    expect(half.discountPercent).toBe(5);
  });

  it("applies no discount for tranche_1 (15%)", () => {
    const options = calculatePaymentOptions(5000);
    const t1 = options.find((o) => o.type === "tranche_1")!;
    expect(t1.festpreisDiscounted).toBe(5000);
    expect(t1.amount).toBe(750); // 15% of 5000
    expect(t1.discount).toBe(0);
    expect(t1.discountPercent).toBe(0);
  });

  it("handles small prices correctly", () => {
    const options = calculatePaymentOptions(299);
    const full = options.find((o) => o.type === "full")!;
    expect(full.festpreisDiscounted).toBe(263); // Math.round(299 * 0.88)
    expect(full.amount).toBe(263);
    expect(full.discount).toBe(36);
  });

  it("preserves original festpreis in all options", () => {
    const options = calculatePaymentOptions(1000);
    for (const option of options) {
      expect(option.festpreisOriginal).toBe(1000);
    }
  });

  it("full payment amount always equals discounted total", () => {
    for (const price of [299, 500, 1000, 2500, 5000, 10000]) {
      const options = calculatePaymentOptions(price);
      const full = options.find((o) => o.type === "full")!;
      expect(full.amount).toBe(full.festpreisDiscounted);
    }
  });

  it("all amounts are integers (no fractional euros)", () => {
    for (const price of [299, 333, 777, 1234, 9999]) {
      const options = calculatePaymentOptions(price);
      for (const option of options) {
        expect(Number.isInteger(option.amount)).toBe(true);
        expect(Number.isInteger(option.discount)).toBe(true);
        expect(Number.isInteger(option.festpreisDiscounted)).toBe(true);
      }
    }
  });
});
