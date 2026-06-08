import { useState } from "react";
import { useStore } from "../store";
import { computeEffectiveBalance, computeMonthlyNetCost } from "../domain/runwayEngine";
import type { Expense, Income } from "../domain/types";

type ItemEditState = {
  name: string;
  amount: string;
};

// ── Shared sub-components ────────────────────────────────────────────────────

function AddForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, amount: number) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<ItemEditState>({ name: "", amount: "" });

  function handleSave() {
    if (!state.name.trim()) return;
    onSave(state.name.trim(), parseFloat(state.amount) || 0);
    setState({ name: "", amount: "" });
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          autoFocus
          placeholder="Name"
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount (EUR)"
          value={state.amount}
          onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Section: Recurring (add + edit + delete) ─────────────────────────────────

function RecurringSection<T extends Expense | Income>({
  title,
  unit,
  items,
  onAdd,
  onUpdate,
  onDelete,
}: {
  title: string;
  unit: string;
  items: T[];
  onAdd: (name: string, amount: number) => void;
  onUpdate: (id: string, name: string, amount: number) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<ItemEditState>({ name: "", amount: "" });

  function startEdit(item: T) {
    setEditingId(item.id);
    setEditState({ name: item.name, amount: String(item.amount) });
  }

  function saveEdit(item: T) {
    onUpdate(item.id, editState.name.trim() || item.name, parseFloat(editState.amount) || 0);
    setEditingId(null);
  }

  function handleDelete(item: T) {
    if (window.confirm(`Delete "${item.name}"? This affects the runway simulation.`)) {
      onDelete(item.id, item.name);
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add
          </button>
        )}
      </div>

      {adding && (
        <AddForm
          onSave={(name, amount) => {
            onAdd(name, amount);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {items.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No items yet.</p>
      )}

      <div className="divide-y divide-gray-100">
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  autoFocus
                  value={editState.name}
                  onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editState.amount}
                  onChange={(e) => setEditState((s) => ({ ...s, amount: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(item)}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={item.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm tabular-nums text-gray-600">
                  €{item.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}{unit}
                </span>
                <button
                  onClick={() => startEdit(item)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ── Section: One-time (add + delete only) ────────────────────────────────────

function OneTimeSection<T extends Expense | Income>({
  title,
  items,
  onAdd,
  onDelete,
}: {
  title: string;
  items: T[];
  onAdd: (name: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add
          </button>
        )}
      </div>

      {adding && (
        <AddForm
          onSave={(name, amount) => {
            onAdd(name, amount);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {items.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No items yet.</p>
      )}

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm tabular-nums text-gray-600">
                €{item.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Plan route ───────────────────────────────────────────────────────────────

export default function Plan() {
  const expenses = useStore((s) => s.expenses);
  const incomes = useStore((s) => s.incomes);
  const startingBalance = useStore((s) => s.settings.startingBalance);

  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const addIncome = useStore((s) => s.addIncome);
  const updateIncome = useStore((s) => s.updateIncome);
  const deleteIncome = useStore((s) => s.deleteIncome);

  const recurringExpenses = expenses.filter((e) => e.type === "recurringExpense");
  const oneTimeExpenses = expenses.filter((e) => e.type === "oneTimeExpense");
  const recurringIncomes = incomes.filter((i) => i.type === "recurringIncome");
  const oneTimeIncomes = incomes.filter((i) => i.type === "oneTimeIncome");

  const totalMonthlyExpenses = computeMonthlyNetCost(expenses, []);
  const effectiveBalance = computeEffectiveBalance(startingBalance, incomes, expenses);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Plan</h1>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-3">
        <div className="text-sm font-medium text-gray-700">
          Total monthly expenses:{" "}
          <span className="font-semibold text-gray-900">
            €{totalMonthlyExpenses.toLocaleString("de-DE", { minimumFractionDigits: 2 })} /month
          </span>
        </div>

        <div className="space-y-1 text-sm text-gray-700">
          <div>
            <span className="tabular-nums text-gray-900 font-medium">
              €{startingBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </span>{" "}
            Starting Balance
          </div>
          {oneTimeIncomes.map((i) => (
            <div key={i.id}>
              <span className="tabular-nums text-green-700 font-medium">
                + €{i.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </span>{" "}
              {i.name}
            </div>
          ))}
          {oneTimeExpenses.map((e) => (
            <div key={e.id}>
              <span className="tabular-nums text-red-600 font-medium">
                − €{e.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </span>{" "}
              {e.name}
            </div>
          ))}
          <div className="border-t border-gray-200 pt-1 font-semibold text-gray-900">
            = €{effectiveBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })} Effective
            Balance
          </div>
        </div>
      </div>

      {/* Recurring Expenses */}
      <RecurringSection
        title="Recurring Expenses"
        unit="/month"
        items={recurringExpenses}
        onAdd={(name, amount) => addExpense({ name, amount, type: "recurringExpense" })}
        onUpdate={(id, name, amount) => updateExpense(id, { name, amount })}
        onDelete={(id) => deleteExpense(id)}
      />

      {/* Recurring Incomes */}
      <RecurringSection
        title="Recurring Incomes"
        unit="/month"
        items={recurringIncomes}
        onAdd={(name, amount) => addIncome({ name, amount, type: "recurringIncome" })}
        onUpdate={(id, name, amount) => updateIncome(id, { name, amount })}
        onDelete={(id) => deleteIncome(id)}
      />

      {/* One-time Expenses */}
      <OneTimeSection
        title="One-time Expenses"
        items={oneTimeExpenses}
        onAdd={(name, amount) => addExpense({ name, amount, type: "oneTimeExpense" })}
        onDelete={(id) => deleteExpense(id)}
      />

      {/* One-time Incomes */}
      <OneTimeSection
        title="One-time Incomes"
        items={oneTimeIncomes}
        onAdd={(name, amount) => addIncome({ name, amount, type: "oneTimeIncome" })}
        onDelete={(id) => deleteIncome(id)}
      />
    </div>
  );
}
