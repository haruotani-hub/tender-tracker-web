import { Parser } from "expr-eval";

const parser = new Parser({ operators: { assignment: false, logical: false, comparison: false, in: false } });

export function calculateQuantity(expression: string): number | null {
  const normalized = expression.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (!normalized.trim() || !/^[\d\s.+\-*/()]+$/.test(normalized)) return null;
  try {
    const result: unknown = parser.evaluate(normalized);
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export const canTransferQuantity = (result: number | null): result is number =>
  result !== null && Number.isInteger(result) && result >= 0 && result <= 99999;