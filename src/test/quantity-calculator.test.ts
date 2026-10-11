import { describe, expect, it } from "vitest";
import { calculateQuantity, canTransferQuantity } from "@/lib/quantity-calculator";

describe("Quantity calculator", () => {
  it("calculates bundles with multiplication and addition", () => {
    expect(calculateQuantity("3 × 100 + 2 × 1000")).toBe(2300);
  });
  it("supports division, subtraction, parentheses and decimal comma", () => {
    expect(calculateQuantity("(10 − 2) ÷ 0,5")).toBe(16);
  });
  it("rejects invalid expressions and division by zero", () => {
    expect(calculateQuantity("2 +")).toBeNull();
    expect(calculateQuantity("10 ÷ 0")).toBeNull();
    expect(calculateQuantity("random()")).toBeNull();
  });
  it("transfers a calculated quantity into only the selected denomination", () => {
    const counts = { selected: 10, other: 25 };
    const result = calculateQuantity("3 × 100 + 2 × 1000");
    if (canTransferQuantity(result)) counts.selected = result;
    expect(counts).toEqual({ selected: 2300, other: 25 });
  });
  it("preserves the existing whole-number quantity range", () => {
    expect(canTransferQuantity(0)).toBe(true);
    expect(canTransferQuantity(99999)).toBe(true);
    expect(canTransferQuantity(100000)).toBe(false);
    expect(canTransferQuantity(-1)).toBe(false);
    expect(canTransferQuantity(1.5)).toBe(false);
    expect(canTransferQuantity(null)).toBe(false);
  });
});