import { describe, it, expect } from "vitest";
import { resolveAmount } from "./resolveAmount";
import type { Category } from "./types";

const expense = (plannedAmount: number, from?: string, until?: string): Category => ({
  id: "c1",
  name: "Food",
  type: "expense",
  plannedAmount,
  from,
  until,
});

describe("resolveAmount", () => {
  it("returns plannedAmount for any month when no from/until set", () => {
    const cat = expense(500);
    expect(resolveAmount(cat, "2026-01")).toBe(500);
    expect(resolveAmount(cat, "2026-05")).toBe(500);
    expect(resolveAmount(cat, "2030-12")).toBe(500);
  });

  it("returns 0 before from, plannedAmount from from onwards (inclusive)", () => {
    const cat = expense(500, "2026-03");
    expect(resolveAmount(cat, "2026-02")).toBe(0);
    expect(resolveAmount(cat, "2026-03")).toBe(500);
    expect(resolveAmount(cat, "2026-04")).toBe(500);
  });

  it("returns plannedAmount up to and including until, 0 after", () => {
    const cat = expense(500, undefined, "2026-06");
    expect(resolveAmount(cat, "2026-05")).toBe(500);
    expect(resolveAmount(cat, "2026-06")).toBe(500);
    expect(resolveAmount(cat, "2026-07")).toBe(0);
  });

  it("returns plannedAmount within the window, 0 outside", () => {
    const cat = expense(500, "2026-03", "2026-06");
    expect(resolveAmount(cat, "2026-02")).toBe(0);
    expect(resolveAmount(cat, "2026-03")).toBe(500);
    expect(resolveAmount(cat, "2026-05")).toBe(500);
    expect(resolveAmount(cat, "2026-06")).toBe(500);
    expect(resolveAmount(cat, "2026-07")).toBe(0);
  });
});
