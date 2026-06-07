import type { Category } from "./types";

/** Returns the planned amount active for a category in a given month (YYYY-MM). */
export function resolveAmount(category: Category, month: string): number {
  const sorted = [...category.plannedAmounts].sort((a, b) =>
    b.from.localeCompare(a.from),
  );
  const match = sorted.find((p) => p.from <= month);
  // Fall back to the earliest known amount when the month precedes all from dates
  return match?.amount ?? sorted[sorted.length - 1]?.amount ?? 0;
}
