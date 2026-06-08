import type { Category } from "./types";

/** Returns the planned amount active for a category in a given month (YYYY-MM). */
export function resolveAmount(category: Category, month: string): number {
  if (category.from && month < category.from) return 0;
  if (category.until && month > category.until) return 0;
  return category.plannedAmount;
}
