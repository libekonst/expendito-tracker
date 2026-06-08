import { createStore as createZustandStore } from "zustand";
import { nanoid } from "nanoid";
import type { Category, Entry, Settings, RunwayResult } from "../domain/types";
import { calculateRunway } from "../domain/runwayEngine";

type State = {
  categories: Category[];
  entries: Entry[];
  settings: Settings;
  storageUnavailable: boolean;
  wizardCompleted: boolean;
};

type WizardPayload = {
  settings: Settings;
  categories: Omit<Category, "id">[];
};

type Actions = {
  addCategory: (cat: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
  addEntry: (entry: Omit<Entry, "id">) => void;
  updateEntry: (id: string, patch: Partial<Omit<Entry, "id">>) => void;
  deleteEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeWizard: (payload: WizardPayload) => void;
  importAll: (payload: { categories: Category[]; entries: Entry[]; settings: Settings }) => void;
};

export type Store = State & Actions;

const STORAGE_KEY = "expendito-v1";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

const defaultSettings: Settings = {
  startingBalance: 0,
  startingMonth: currentMonth(),
};

type PersistedSlice = {
  categories?: Category[];
  entries?: Entry[];
  settings?: Settings;
  wizardCompleted?: boolean;
};

type LegacyCategory = {
  id: string;
  name: string;
  type: "expense" | "income";
  plannedAmounts?: Array<{ amount: number; from: string }>;
};

function migrateCategories(categories: LegacyCategory[]): Category[] {
  return categories.map((cat) => {
    if ("plannedAmounts" in cat && Array.isArray(cat.plannedAmounts)) {
      const { plannedAmounts, ...rest } = cat;
      return { ...rest, plannedAmount: plannedAmounts[0]?.amount ?? 0 };
    }
    return cat as Category;
  });
}

function loadPersistedState(): PersistedSlice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const slice = (JSON.parse(raw) as { state?: PersistedSlice & { categories?: LegacyCategory[] } }).state ?? {};
    if (slice.categories) {
      slice.categories = migrateCategories(slice.categories as LegacyCategory[]);
    }
    return slice;
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
          categories: state.categories,
          entries: state.entries,
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
    categories: persisted.categories ?? [],
    entries: persisted.entries ?? [],
    settings: persisted.settings ?? defaultSettings,
    storageUnavailable: !storageAvailable,
    wizardCompleted: persisted.wizardCompleted ?? false,

    addCategory: (cat) =>
      set((s) => ({ categories: [...s.categories, { id: nanoid(), ...cat }] })),

    updateCategory: (id, patch) =>
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),

    deleteCategory: (id) =>
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        entries: s.entries.filter((e) => e.categoryId !== id),
      })),

    addEntry: (entry) =>
      set((s) => ({ entries: [...s.entries, { id: nanoid(), ...entry }] })),

    updateEntry: (id, patch) =>
      set((s) => ({
        entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),

    deleteEntry: (id) =>
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

    updateSettings: (patch) =>
      set((s) => ({ settings: { ...s.settings, ...patch } })),

    completeWizard: ({ settings, categories }) =>
      set({
        settings,
        categories: categories.map((c) => ({ id: nanoid(), ...c })),
        wizardCompleted: true,
      }),

    importAll: (payload: { categories: Category[]; entries: Entry[]; settings: Settings }) =>
      set({ ...payload, wizardCompleted: true }),
  }));

  if (storageAvailable) {
    s.subscribe((state) => saveState(state));
  }

  return s;
}

/** Derives the runway projection from current store state. Use as a Zustand selector. */
export function selectRunwayProjection(state: Store): RunwayResult {
  return calculateRunway(state.settings, state.categories, state.entries);
}

// Singleton store for the app
export const store = createStore();

// React hook
import { useStore as useZustandStore } from "zustand";
export const useStore = <T>(selector: (state: Store) => T): T =>
  useZustandStore(store, selector);
