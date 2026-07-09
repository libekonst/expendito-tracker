import { createStore as createZustandStore } from "zustand";
import { nanoid } from "nanoid";
import type { Expense, Income, Settings, RunwayResult } from "../domain/types";
import { calculateRunway } from "../domain/runwayEngine";
import { currentMonth } from "../domain/dateUtils";

type State = {
  expenses: Expense[];
  incomes: Income[];
  settings: Settings;
  storageUnavailable: boolean;
  wizardCompleted: boolean;
};

type Actions = {
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Pick<Expense, "name" | "amount">>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (id: string, patch: Partial<Pick<Income, "name" | "amount">>) => void;
  deleteIncome: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeWizard: (payload: { settings: Settings; expenses: Omit<Expense, "id">[] }) => void;
  importAll: (payload: { expenses: Expense[]; incomes: Income[]; settings: Settings }) => void;
};

export type Store = State & Actions;

const STORAGE_KEY = "expendito-v2";

const defaultSettings: Settings = {
  startingBalance: 0,
  startingMonth: currentMonth(),
};

type PersistedSlice = {
  expenses?: Expense[];
  incomes?: Income[];
  settings?: Settings;
  wizardCompleted?: boolean;
};

function loadPersistedState(): PersistedSlice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as { state?: PersistedSlice }).state ?? {};
  } catch {
    return {};
  }
}

function saveState(state: State): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          expenses: state.expenses,
          incomes: state.incomes,
          settings: state.settings,
          wizardCompleted: state.wizardCompleted,
        },
      }),
    );
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}

function isStorageAvailable(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY + "_test", "1");
    localStorage.removeItem(STORAGE_KEY + "_test");
    return true;
  } catch {
    return false;
  }
}

export function createStore() {
  const storageAvailable = isStorageAvailable();
  const persisted = storageAvailable ? loadPersistedState() : {};

  const s = createZustandStore<Store>()((set) => ({
    expenses: persisted.expenses ?? [],
    incomes: persisted.incomes ?? [],
    settings: persisted.settings ?? defaultSettings,
    storageUnavailable: !storageAvailable,
    wizardCompleted: persisted.wizardCompleted ?? false,

    addExpense: (expense) =>
      set((s) => ({ expenses: [...s.expenses, { id: nanoid(), ...expense }] })),

    updateExpense: (id, patch) =>
      set((s) => ({
        expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),

    deleteExpense: (id) =>
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

    addIncome: (income) =>
      set((s) => ({ incomes: [...s.incomes, { id: nanoid(), ...income }] })),

    updateIncome: (id, patch) =>
      set((s) => ({
        incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),

    deleteIncome: (id) =>
      set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

    updateSettings: (patch) =>
      set((s) => ({ settings: { ...s.settings, ...patch } })),

    completeWizard: ({ settings, expenses }) =>
      set({
        settings,
        expenses: expenses.map((e) => ({ id: nanoid(), ...e })),
        wizardCompleted: true,
      }),

    importAll: (payload) =>
      set({ ...payload, wizardCompleted: true }),
  }));

  if (storageAvailable) {
    s.subscribe((state) => saveState(state));
  }

  return s;
}

/** Derives the runway projection from current store state. Use as a Zustand selector. */
export function selectRunwayProjection(state: Store): RunwayResult {
  return calculateRunway(state.settings, state.expenses, state.incomes);
}

// Singleton store for the app
export const store = createStore();

// React hook
import { useStore as useZustandStore } from "zustand";
export const useStore = <T>(selector: (state: Store) => T): T =>
  useZustandStore(store, selector);
