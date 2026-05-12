import { createStore as createZustandStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
};

export type Store = State & Actions;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function isStorageAvailable(): boolean {
  try {
    const key = "__expendito_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const defaultSettings: Settings = {
  startingBalance: 0,
  startingMonth: currentMonth(),
};

export function createStore() {
  const storageAvailable = isStorageAvailable();

  return createZustandStore<Store>()(
    persist(
      (set) => ({
        categories: [],
        entries: [],
        settings: defaultSettings,
        storageUnavailable: !storageAvailable,
        wizardCompleted: false,

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
      }),
      {
        name: "expendito-v1",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
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
