import { useState } from "react";
import { useStore } from "../store";
import type { Category } from "../domain/types";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type EditState = {
  name: string;
  type: Category["type"];
  plannedAmount: string;
};

export default function Categories() {
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", type: "expense", plannedAmount: "" });

  const [adding, setAdding] = useState(false);
  const [addState, setAddState] = useState<EditState>({ name: "", type: "expense", plannedAmount: "" });

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditState({
      name: cat.name,
      type: cat.type,
      plannedAmount: String(cat.plannedAmount),
    });
  }

  function saveEdit(cat: Category) {
    const newAmount = parseFloat(editState.plannedAmount) || 0;
    updateCategory(cat.id, {
      name: editState.name,
      type: editState.type,
      plannedAmount: newAmount,
    });
    setEditingId(null);
  }

  function confirmDelete(cat: Category) {
    const entryCount = /* derived in store */ 0; // store handles cascade
    if (window.confirm(`Delete "${cat.name}"? This will also remove all its entries.`)) {
      deleteCategory(cat.id);
    }
  }

  function saveAdd() {
    if (!addState.name.trim()) return;
    addCategory({
      name: addState.name.trim(),
      type: addState.type,
      plannedAmount: parseFloat(addState.plannedAmount) || 0,
    });
    setAdding(false);
    setAddState({ name: "", type: "expense", plannedAmount: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={() => setAdding(true)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add category
        </button>
      </div>

      {adding && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">New category</h2>
          <div className="grid grid-cols-3 gap-3">
            <input
              autoFocus
              placeholder="Name"
              value={addState.name}
              onChange={(e) => setAddState((s) => ({ ...s, name: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={addState.type}
              onChange={(e) => setAddState((s) => ({ ...s, type: e.target.value as Category["type"] }))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Planned amount (EUR)"
              value={addState.plannedAmount}
              onChange={(e) => setAddState((s) => ({ ...s, plannedAmount: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveAdd} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
              Save
            </button>
            <button onClick={() => setAdding(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && !adding && (
        <p className="text-sm text-gray-500">No categories yet. Add one to start planning.</p>
      )}

      <div className="divide-y divide-gray-100">
        {categories.map((cat) =>
          editingId === cat.id ? (
            <div key={cat.id} className="py-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  autoFocus
                  value={editState.name}
                  onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <select
                  value={editState.type}
                  onChange={(e) => setEditState((s) => ({ ...s, type: e.target.value as Category["type"] }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editState.plannedAmount}
                  onChange={(e) => setEditState((s) => ({ ...s, plannedAmount: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(cat)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={cat.id} className="flex items-center justify-between py-3">
              <div>
                <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{cat.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm tabular-nums text-gray-600">
                  €{cat.plannedAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}/mo
                </span>
                <button onClick={() => startEdit(cat)} className="text-sm text-indigo-600 hover:text-indigo-800">
                  Edit
                </button>
                <button onClick={() => confirmDelete(cat)} className="text-sm text-red-500 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
