import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateRunway,
  computeEffectiveBalance,
  computeMonthlyNetCost,
} from "./runwayEngine";
import type { Expense, Income, Settings } from "./types";

const settings = (startingBalance: number, startingMonth: string): Settings => ({
  startingBalance,
  startingMonth,
});

const recurringExpense = (id: string, amount: number): Expense => ({
  id,
  name: id,
  type: "recurringExpense",
  amount,
});

const oneTimeExpense = (id: string, amount: number): Expense => ({
  id,
  name: id,
  type: "oneTimeExpense",
  amount,
});

const recurringIncome = (id: string, amount: number): Income => ({
  id,
  name: id,
  type: "recurringIncome",
  amount,
});

const oneTimeIncome = (id: string, amount: number): Income => ({
  id,
  name: id,
  type: "oneTimeIncome",
  amount,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-09T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("computeEffectiveBalance", () => {
  it("adds one-time incomes and subtracts one-time expenses, ignoring recurring", () => {
    const result = computeEffectiveBalance(
      5000,
      [recurringIncome("salary", 300), oneTimeIncome("bonus", 2000)],
      [recurringExpense("rent", 1000), oneTimeExpense("car", 1500)],
    );
    expect(result).toBe(5000 + 2000 - 1500);
  });

  it("returns the starting balance when there are no one-time items", () => {
    expect(
      computeEffectiveBalance(5000, [recurringIncome("salary", 300)], [
        recurringExpense("rent", 1000),
      ]),
    ).toBe(5000);
  });
});

describe("computeMonthlyNetCost", () => {
  it("is the sum of recurring expenses minus recurring incomes", () => {
    const cost = computeMonthlyNetCost(
      [recurringExpense("rent", 1000), oneTimeExpense("car", 5000)],
      [recurringIncome("salary", 300), oneTimeIncome("bonus", 2000)],
    );
    expect(cost).toBe(1000 - 300);
  });
});

describe("calculateRunway", () => {
  it("1. basic runway: 10000 balance, 1000/month → 10 months ending 2026-10", () => {
    const result = calculateRunway(
      settings(10000, "2026-01"),
      [recurringExpense("rent", 1000)],
      [],
    );
    expect(result.totalMonths).toBe(10);
    expect(result.endMonth).toBe("2026-10");
    expect(result.effectiveBalance).toBe(10000);
    expect(result.months).toHaveLength(10);
    expect(result.overhang).toBeUndefined();
  });

  it("2. overhang: 2500 balance, 1000/month → 2 months + overhang", () => {
    const result = calculateRunway(
      settings(2500, "2026-01"),
      [recurringExpense("rent", 1000)],
      [],
    );
    expect(result.totalMonths).toBe(2);
    expect(result.overhang).toEqual({ remainingBalance: 500, shortfall: 500 });
  });

  it("3. recurring income offsets expense → net 700/month, 7 months", () => {
    const result = calculateRunway(
      settings(5000, "2026-01"),
      [recurringExpense("rent", 1000)],
      [recurringIncome("salary", 300)],
    );
    expect(result.totalMonths).toBe(7);
  });

  it("4. one-time expense shortens runway → effectiveBalance 4000, 4 months", () => {
    const result = calculateRunway(
      settings(5000, "2026-01"),
      [recurringExpense("rent", 1000), oneTimeExpense("car", 1000)],
      [],
    );
    expect(result.effectiveBalance).toBe(4000);
    expect(result.totalMonths).toBe(4);
  });

  it("5. one-time income extends runway → effectiveBalance 7000, 7 months", () => {
    const result = calculateRunway(
      settings(5000, "2026-01"),
      [recurringExpense("rent", 1000)],
      [oneTimeIncome("bonus", 2000)],
    );
    expect(result.effectiveBalance).toBe(7000);
    expect(result.totalMonths).toBe(7);
  });

  it("6. waiting period: future startingMonth → remainingMonths === totalMonths", () => {
    const result = calculateRunway(
      settings(3000, "2027-01"),
      [recurringExpense("rent", 1000)],
      [],
    );
    expect(result.totalMonths).toBe(3);
    expect(result.remainingMonths).toBe(3);
    expect(result.remainingMonths).toBe(result.totalMonths);
  });

  it("7. partially elapsed: past startingMonth → remainingMonths < totalMonths", () => {
    const result = calculateRunway(
      settings(12000, "2026-01"),
      [recurringExpense("rent", 1000)],
      [],
    );
    expect(result.totalMonths).toBe(12);
    expect(result.endMonth).toBe("2026-12");
    // today is 2026-06; only 2026-07..2026-12 remain → 6
    expect(result.remainingMonths).toBe(6);
    expect(result.remainingMonths).toBeLessThan(result.totalMonths);
  });

  it("8. 120-month safety cap: net cost <= 0 → months.length <= 120", () => {
    const result = calculateRunway(
      settings(10000, "2026-01"),
      [recurringExpense("rent", 500)],
      [recurringIncome("salary", 600)],
    );
    expect(result.months.length).toBeLessThanOrEqual(120);
  });

  it("9. empty expenses: no burn → no runway (totalMonths 0, no months)", () => {
    // Choice (a): net cost <= 0 means the runway never burns down, so we
    // return totalMonths 0 with no months rather than filling the 120-cap.
    const result = calculateRunway(settings(5000, "2026-01"), [], []);
    expect(result.totalMonths).toBe(0);
    expect(result.months).toHaveLength(0);
  });

  it("10. floating-point drift: decimal amounts don't cause an early or spurious overhang", () => {
    const result = calculateRunway(
      settings(10001, "2026-01"),
      [recurringExpense("rent", 1000.1)],
      [],
    );
    expect(result.totalMonths).toBe(10);
    expect(result.overhang).toBeUndefined();
  });

  it("11. capExceeded: net cost <= 0 hits the 120-month cap without depleting", () => {
    const result = calculateRunway(
      settings(10000, "2026-01"),
      [recurringExpense("rent", 500)],
      [recurringIncome("salary", 499)],
    );
    expect(result.months).toHaveLength(120);
    expect(result.capExceeded).toBe(true);
  });

  it("threads opening/closing balances forward across months", () => {
    const result = calculateRunway(
      settings(3000, "2026-01"),
      [recurringExpense("rent", 1000)],
      [],
    );
    expect(result.months[0]).toMatchObject({
      month: "2026-01",
      openingBalance: 3000,
      closingBalance: 2000,
    });
    expect(result.months[1]).toMatchObject({
      month: "2026-02",
      openingBalance: 2000,
      closingBalance: 1000,
    });
    expect(result.months[2]).toMatchObject({
      month: "2026-03",
      openingBalance: 1000,
      closingBalance: 0,
    });
  });
});
