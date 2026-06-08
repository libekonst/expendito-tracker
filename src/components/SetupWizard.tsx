import { useState } from "react";
import { useStore } from "../store";
import type { Expense } from "../domain/types";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type DraftCategory = {
  key: string; // local key for React list
  name: string;
  type: "expense" | "income";
  plannedAmount: string;
};

const SUGGESTED: Omit<DraftCategory, "key">[] = [
  { name: "Rent", type: "expense", plannedAmount: "" },
  { name: "Food", type: "expense", plannedAmount: "" },
  { name: "Transport", type: "expense", plannedAmount: "" },
  { name: "Utilities", type: "expense", plannedAmount: "" },
  { name: "Entertainment", type: "expense", plannedAmount: "" },
  { name: "Other", type: "expense", plannedAmount: "" },
];

export default function SetupWizard() {
  const completeWizard = useStore((s) => s.completeWizard);
  const cm = currentMonth();

  const [balance, setBalance] = useState("");
  const [startingMonth, setStartingMonth] = useState(cm);
  const [cats, setCats] = useState<DraftCategory[]>(
    SUGGESTED.map((s, i) => ({ ...s, key: String(i) }))
  );
  const [error, setError] = useState("");

  let nextKey = cats.length;

  function updateCat(key: string, patch: Partial<DraftCategory>) {
    setCats((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function removeCat(key: string) {
    setCats((cs) => cs.filter((c) => c.key !== key));
  }

  function addCat() {
    setCats((cs) => [...cs, { key: String(nextKey++), name: "", type: "expense", plannedAmount: "" }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const startingBalance = parseFloat(balance);
    if (!startingBalance && startingBalance !== 0) {
      setError("Enter a valid starting balance.");
      return;
    }
    if (!startingMonth) {
      setError("Select a starting month.");
      return;
    }
    setError("");

    const expenses: Omit<Expense, "id">[] = cats
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        type: c.type === "income" ? ("recurringIncome" as const) : ("recurringExpense" as const),
        amount: parseFloat(c.plannedAmount) || 0,
      }));

    completeWizard({ settings: { startingBalance, startingMonth }, expenses });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Expendito</h1>
      <p className="mt-2 text-gray-500">Set up your runway in a few steps.</p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        {/* Starting balance + month */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Starting balance (EUR)
            </label>
            <p className="text-xs text-gray-400">Your total savings the day you quit.</p>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 30000"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              autoFocus
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Starting month</label>
            <p className="text-xs text-gray-400">The first month the runway calculation starts from.</p>
            <input
              type="month"
              value={startingMonth}
              onChange={(e) => setStartingMonth(e.target.value)}
              required
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-sm font-medium text-gray-700">Monthly expenses</p>
          <p className="text-xs text-gray-400 mb-3">Rename, remove, or add categories. Set a planned monthly amount for each.</p>
          <div className="space-y-2">
            {cats.map((cat) => (
              <div key={cat.key} className="flex items-center gap-2">
                <input
                  value={cat.name}
                  onChange={(e) => updateCat(cat.key, { name: e.target.value })}
                  placeholder="Category name"
                  className="w-36 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <select
                  value={cat.type}
                  onChange={(e) => updateCat(cat.key, { type: e.target.value as Category["type"] })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="€/month"
                  value={cat.plannedAmount}
                  onChange={(e) => updateCat(cat.key, { plannedAmount: e.target.value })}
                  className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCat(cat.key)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCat}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Add category
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Start tracking →
        </button>
      </form>
    </div>
  );
}
