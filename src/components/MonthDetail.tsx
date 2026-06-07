import { useState } from "react";
import { useStore } from "../store";
import { projectMonth } from "../domain/projectMonth";
import type { Entry } from "../domain/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type QuickAddState = {
  amount: string;
  categoryId: string;
  date: string;
  note: string;
};

type EditState = QuickAddState & { id: string };

type Props = { month: string; isCurrentMonth: boolean; openingBalance: number; actualsOnly?: boolean };

export default function MonthDetail({ month, isCurrentMonth, openingBalance, actualsOnly = false }: Props) {
  const categories = useStore((s) => s.categories);
  const allEntries = useStore((s) => s.entries);
  const addEntry = useStore((s) => s.addEntry);
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const monthEntries = allEntries.filter((e) => e.date.startsWith(month));

  const summary = projectMonth({
    month,
    categories,
    entries: monthEntries,
    openingBalance,
    isCurrentMonth,
    actualsOnly,
  });

  const defaultDate = isCurrentMonth ? today() : `${month}-01`;
  const firstCategory = categories[0];

  const [form, setForm] = useState<QuickAddState>({
    amount: "",
    categoryId: firstCategory?.id ?? "",
    date: defaultDate,
    note: "",
  });

  const [editingEntry, setEditingEntry] = useState<EditState | null>(null);

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || !form.categoryId) return;
    addEntry({ categoryId: form.categoryId, amount, date: form.date, note: form.note || undefined });
    setForm((f) => ({ ...f, amount: "", note: "" }));
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    const amount = parseFloat(editingEntry.amount);
    if (!amount) return;
    updateEntry(editingEntry.id, {
      categoryId: editingEntry.categoryId,
      amount,
      date: editingEntry.date,
      note: editingEntry.note || undefined,
    });
    setEditingEntry(null);
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function varianceClass(categoryId: string, variance: number): string {
    const cat = catMap[categoryId];
    if (!cat) return "text-gray-500";
    const bad = cat.type === "expense" ? variance > 0 : variance < 0;
    return bad ? "text-red-600" : "text-emerald-600";
  }

  const sortedEntries = [...monthEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Opening balance */}
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
        <span className="text-sm text-gray-500">Opening balance</span>
        <span className="tabular-nums font-medium text-gray-900">€{fmt(summary.openingBalance)}</span>
      </div>

      {/* Planned vs actual tables */}
      {[
        { label: "Expenses", cats: expenseCategories },
        { label: "Income", cats: incomeCategories },
      ].map(({ label, cats }) =>
        cats.length === 0 ? null : (
          <div key={label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-1 text-left font-medium">Category</th>
                  <th className="pb-1 text-right font-medium">Planned</th>
                  <th className="pb-1 text-right font-medium">Actual</th>
                  <th className="pb-1 text-right font-medium">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cats.map((cat) => {
                  const row = summary.categories.find((c) => c.categoryId === cat.id);
                  if (!row) return null;
                  return (
                    <tr key={cat.id}>
                      <td className="py-1.5 text-gray-700">{cat.name}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-500">€{fmt(row.planned)}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-900">€{fmt(row.actual)}</td>
                      <td className={`py-1.5 text-right tabular-nums ${varianceClass(cat.id, row.variance)}`}>
                        {row.variance > 0 ? "+" : ""}€{fmt(row.variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Closing balance */}
      <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-500">Closing balance</span>
        <span className={`tabular-nums font-semibold ${summary.closingBalance < 0 ? "text-red-600" : "text-gray-900"}`}>
          €{fmt(summary.closingBalance)}
        </span>
      </div>

      {/* Quick-add form */}
      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Add entry</p>
          <form onSubmit={submitAdd} className="flex flex-wrap gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Entry list */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Entries</p>
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-gray-400">No entries for this month.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedEntries.map((entry) =>
              editingEntry?.id === entry.id ? (
                <form key={entry.id} onSubmit={submitEdit} className="flex flex-wrap gap-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingEntry.amount}
                    onChange={(e) => setEditingEntry((s) => s && { ...s, amount: e.target.value })}
                    required
                    className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <select
                    value={editingEntry.categoryId}
                    onChange={(e) => setEditingEntry((s) => s && { ...s, categoryId: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry((s) => s && { ...s, date: e.target.value })}
                    required
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Note"
                    value={editingEntry.note}
                    onChange={(e) => setEditingEntry((s) => s && { ...s, note: e.target.value })}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingEntry(null)} className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </form>
              ) : (
                <div key={entry.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{entry.date}</span>
                    <span className="text-gray-900">€{fmt(entry.amount)}</span>
                    <span className="text-gray-500">{catMap[entry.categoryId]?.name ?? "—"}</span>
                    {entry.note && <span className="text-gray-400 italic">{entry.note}</span>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setEditingEntry({
                          id: entry.id,
                          amount: String(entry.amount),
                          categoryId: entry.categoryId,
                          date: entry.date,
                          note: entry.note ?? "",
                        })
                      }
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
