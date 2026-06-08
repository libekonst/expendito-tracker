import { describe, it, expect } from "vitest";
import { exportData, importData } from "./serializer";
import type { Expense, Income, Settings } from "./types";

const settings: Settings = { startingBalance: 10000, startingMonth: "2026-01" };

const expenses: Expense[] = [
  { id: "e1", name: "Rent", type: "recurringExpense", amount: 900 },
  { id: "e2", name: "New laptop", type: "oneTimeExpense", amount: 1500 },
];

const incomes: Income[] = [
  { id: "i1", name: "Freelance", type: "recurringIncome", amount: 300 },
  { id: "i2", name: "Tax refund", type: "oneTimeIncome", amount: 2000 },
];

describe("exportData", () => {
  it("serialises expenses, incomes, and settings to a JSON string", () => {
    const json = exportData({ expenses, incomes, settings });
    const parsed = JSON.parse(json);
    expect(parsed.expenses).toEqual(expenses);
    expect(parsed.incomes).toEqual(incomes);
    expect(parsed.settings).toEqual(settings);
  });

  it("includes a version field", () => {
    const json = exportData({ expenses, incomes, settings });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBeDefined();
  });
});

describe("importData", () => {
  it("round-trips exported data correctly", () => {
    const json = exportData({ expenses, incomes, settings });
    const result = importData(json);
    expect(result.expenses).toEqual(expenses);
    expect(result.incomes).toEqual(incomes);
    expect(result.settings).toEqual(settings);
  });

  it("throws on malformed JSON", () => {
    expect(() => importData("not json")).toThrow();
  });

  it("throws when expenses is missing", () => {
    const bad = JSON.stringify({ incomes, settings, version: 1 });
    expect(() => importData(bad)).toThrow();
  });

  it("throws when incomes is missing", () => {
    const bad = JSON.stringify({ expenses, settings, version: 1 });
    expect(() => importData(bad)).toThrow();
  });

  it("throws when settings is missing", () => {
    const bad = JSON.stringify({ expenses, incomes, version: 1 });
    expect(() => importData(bad)).toThrow();
  });
});
