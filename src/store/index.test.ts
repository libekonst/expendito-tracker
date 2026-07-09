import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore, selectRunwayProjection } from "./index";
import { exportData, importData } from "../domain/serializer";

beforeEach(() => {
  localStorage.clear();
});

describe("expense CRUD", () => {
  it("adds a RecurringExpense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    expect(store.getState().expenses).toHaveLength(1);
    expect(store.getState().expenses[0].name).toBe("Rent");
    expect(store.getState().expenses[0].type).toBe("recurringExpense");
    expect(store.getState().expenses[0].id).toBeTruthy();
  });

  it("updates an expense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    const id = store.getState().expenses[0].id;
    store.getState().updateExpense(id, { amount: 1000 });
    expect(store.getState().expenses[0].amount).toBe(1000);
  });

  it("deletes an expense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    const id = store.getState().expenses[0].id;
    store.getState().deleteExpense(id);
    expect(store.getState().expenses).toHaveLength(0);
  });
});

describe("income CRUD", () => {
  it("adds a RecurringIncome", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    expect(store.getState().incomes).toHaveLength(1);
    expect(store.getState().incomes[0].name).toBe("Freelance");
    expect(store.getState().incomes[0].type).toBe("recurringIncome");
    expect(store.getState().incomes[0].id).toBeTruthy();
  });

  it("updates an income", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    const id = store.getState().incomes[0].id;
    store.getState().updateIncome(id, { amount: 600 });
    expect(store.getState().incomes[0].amount).toBe(600);
  });

  it("deletes an income", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    const id = store.getState().incomes[0].id;
    store.getState().deleteIncome(id);
    expect(store.getState().incomes).toHaveLength(0);
  });
});

describe("settings", () => {
  it("updates settings", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 5000 });
    expect(store.getState().settings.startingBalance).toBe(5000);
  });
});

describe("selectRunwayProjection", () => {
  it("returns correct totalMonths given a recurring expense", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 2000, startingMonth: "2025-01" });
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 1000 });

    const result = selectRunwayProjection(store.getState());
    expect(result.totalMonths).toBe(2);
  });

  it("reflects reduced totalMonths when expense amount increases", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 2000, startingMonth: "2025-01" });
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 1000 });

    const before = selectRunwayProjection(store.getState());
    expect(before.totalMonths).toBe(2);

    const id = store.getState().expenses[0].id;
    store.getState().updateExpense(id, { amount: 2000 });

    const after = selectRunwayProjection(store.getState());
    expect(after.totalMonths).toBe(1);
  });
});

describe("storageUnavailable", () => {
  it("is true when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const store = createStore();
    expect(store.getState().storageUnavailable).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("importAll", () => {
  it("importAll overwrites expenses, incomes, and settings", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Old", type: "recurringExpense", amount: 100 });
    store.getState().importAll({
      expenses: [{ id: "e1", name: "Rent", type: "recurringExpense", amount: 800 }],
      incomes: [{ id: "i1", name: "Rental", type: "recurringIncome", amount: 300 }],
      settings: { startingBalance: 10000, startingMonth: "2026-07" },
    });
    const state = store.getState();
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].name).toBe("Rent");
    expect(state.incomes).toHaveLength(1);
    expect(state.settings.startingBalance).toBe(10000);
  });
});

describe("export/import round-trip", () => {
  it("exports store expenses/incomes/settings and re-imports them unchanged", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    store.getState().addIncome({ name: "Salary", type: "recurringIncome", amount: 300 });
    store.getState().updateSettings({ startingBalance: 5000, startingMonth: "2026-07" });

    const { expenses, incomes, settings } = store.getState();
    const json = exportData({ expenses, incomes, settings });
    const imported = importData(json);

    expect(imported.expenses).toHaveLength(1);
    expect(imported.expenses[0].name).toBe("Rent");
    expect(imported.incomes).toHaveLength(1);
    expect(imported.incomes[0].name).toBe("Salary");
    expect(imported.settings.startingBalance).toBe(5000);
  });
});

describe("persistence", () => {
  it("persists and reloads expenses and incomes across store instances", () => {
    const store1 = createStore();
    store1.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    store1.getState().addIncome({ name: "Salary", type: "recurringIncome", amount: 300 });

    const store2 = createStore(); // reads from same localStorage
    expect(store2.getState().expenses).toHaveLength(1);
    expect(store2.getState().expenses[0].name).toBe("Rent");
    expect(store2.getState().incomes).toHaveLength(1);
    expect(store2.getState().incomes[0].name).toBe("Salary");
  });
});
