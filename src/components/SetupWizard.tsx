import { useState } from "react";
import { useStore } from "../store";
import type { Expense } from "../domain/types";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type DraftExpense = {
  key: string; // local key for React list
  name: string;
  plannedAmount: string;
};

const SUGGESTED: Omit<DraftExpense, "key">[] = [
  { name: "Rent", plannedAmount: "" },
  { name: "Food", plannedAmount: "" },
  { name: "Transport", plannedAmount: "" },
  { name: "Utilities", plannedAmount: "" },
  { name: "Entertainment", plannedAmount: "" },
  { name: "Other", plannedAmount: "" },
];

export default function SetupWizard() {
  const completeWizard = useStore((s) => s.completeWizard);
  const cm = currentMonth();

  const [balance, setBalance] = useState("");
  const [startingMonth, setStartingMonth] = useState(cm);
  const [expenses, setExpenses] = useState<DraftExpense[]>(
    SUGGESTED.map((s, i) => ({ ...s, key: String(i) }))
  );
  const [error, setError] = useState("");

  let nextKey = expenses.length;

  function updateExpense(key: string, patch: Partial<DraftExpense>) {
    setExpenses((es) => es.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function removeExpense(key: string) {
    setExpenses((es) => es.filter((e) => e.key !== key));
  }

  function addExpense() {
    setExpenses((es) => [...es, { key: String(nextKey++), name: "", plannedAmount: "" }]);
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

    const seedExpenses: Omit<Expense, "id">[] = expenses
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        type: "recurringExpense" as const,
        amount: parseFloat(e.plannedAmount) || 0,
      }));

    completeWizard({ settings: { startingBalance, startingMonth }, expenses: seedExpenses });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Set up your runway</h1>
      <p className="mt-2 text-gray-500">
        Tell us about your savings and monthly expenses — we'll calculate how long your runway lasts.
      </p>

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

        {/* Recurring Expenses */}
        <div>
          <p className="text-sm font-medium text-gray-700">Recurring Expenses</p>
          <p className="text-xs text-gray-400 mb-3">
            These are your fixed monthly costs. We'll calculate how long your savings will last.
          </p>
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div key={exp.key} className="flex items-center gap-2">
                <input
                  value={exp.name}
                  onChange={(e) => updateExpense(exp.key, { name: e.target.value })}
                  placeholder="Expense name"
                  className="w-36 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="€/month"
                  value={exp.plannedAmount}
                  onChange={(e) => updateExpense(exp.key, { plannedAmount: e.target.value })}
                  className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeExpense(exp.key)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExpense}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Add expense
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Calculate my runway →
        </button>
      </form>
    </div>
  );
}
