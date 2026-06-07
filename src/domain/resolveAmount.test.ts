import { describe, it, expect } from "vitest";
import { resolveAmount } from "./resolveAmount";
import type { Category } from "./types";

const expense = (plannedAmounts: Category["plannedAmounts"]): Category => ({
  id: "c1",
  name: "Food",
  type: "expense",
  plannedAmounts,
});

describe("resolveAmount", () => {
  it("returns 0 when category has no planned amounts", () => {
    expect(resolveAmount(expense([]), "2026-05")).toBe(0);
  });

  it("returns 0 when queried month is before all planned amounts", () => {
    const cat = expense([{ amount: 500, from: "2026-03" }]);
    expect(resolveAmount(cat, "2026-02")).toBe(0);
  });

  it("returns the amount whose from equals the queried month", () => {
    const cat = expense([{ amount: 500, from: "2026-05" }]);
    expect(resolveAmount(cat, "2026-05")).toBe(500);
  });

  it("returns the most recent prior amount when queried month is after all entries", () => {
    const cat = expense([{ amount: 500, from: "2026-01" }]);
    expect(resolveAmount(cat, "2026-08")).toBe(500);
  });

  it("returns the most recent effective amount when multiple entries exist", () => {
    const cat = expense([
      { amount: 400, from: "2026-01" },
      { amount: 600, from: "2026-04" },
      { amount: 800, from: "2026-07" },
    ]);
    expect(resolveAmount(cat, "2026-05")).toBe(600);
    expect(resolveAmount(cat, "2026-07")).toBe(800);
    expect(resolveAmount(cat, "2026-03")).toBe(400);
  });
});
