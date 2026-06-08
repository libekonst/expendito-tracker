import { describe, it, expect } from "vitest";
import { calculateRunway } from "./runwayEngine";
import type { Category, Entry, Settings } from "./types";

const settings = (startingBalance: number, startingMonth: string): Settings => ({
  startingBalance,
  startingMonth,
});

const expenseCategory = (id: string, amount: number): Category => ({
  id,
  name: id,
  type: "expense",
  plannedAmount: amount,
});

const incomeCategory = (id: string, amount: number): Category => ({
  id,
  name: id,
  type: "income",
  plannedAmount: amount,
});

describe("calculateRunway", () => {
  it("returns correct runwayMonths for a simple fixture", () => {
    // €10,000 balance, €1,000/month net burn → 10 months
    const { runwayMonths } = calculateRunway(
      settings(10000, "2026-01"),
      [expenseCategory("rent", 1000)],
      [],
    );
    expect(runwayMonths).toBe(10);
  });

  it("threads closing balance correctly across month boundaries", () => {
    const { months } = calculateRunway(
      settings(3000, "2026-01"),
      [expenseCategory("rent", 1000)],
      [],
    );
    expect(months[0].openingBalance).toBe(3000);
    expect(months[0].closingBalance).toBe(2000);
    expect(months[1].openingBalance).toBe(2000);
    expect(months[1].closingBalance).toBe(1000);
    expect(months[2].openingBalance).toBe(1000);
    expect(months[2].closingBalance).toBe(0);
  });

  it("stops when closing balance reaches zero", () => {
    const { months, runwayMonths } = calculateRunway(
      settings(2000, "2026-01"),
      [expenseCategory("rent", 1000)],
      [],
    );
    expect(runwayMonths).toBe(2);
    expect(months).toHaveLength(2);
  });

  it("caps at 120 months", () => {
    // income covers all expenses — would run forever
    const { months } = calculateRunway(
      settings(10000, "2026-01"),
      [expenseCategory("rent", 500), incomeCategory("salary", 600)],
      [],
    );
    expect(months.length).toBeLessThanOrEqual(120);
  });

  it("uses actual entries over planned amounts for past months", () => {
    const entries: Entry[] = [
      { id: "e1", categoryId: "rent", amount: 1500, date: "2026-01-05" },
    ];
    const { months } = calculateRunway(
      settings(5000, "2026-01"),
      [expenseCategory("rent", 1000)],
      entries,
    );
    // Actual spend was 1500, not planned 1000
    expect(months[0].closingBalance).toBe(3500);
  });
});
