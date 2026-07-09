import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../store";
import {
  calculateRunway,
  computeMonthlyNetCost,
  computeEffectiveBalance,
} from "../domain/runwayEngine";
import { addMonth, currentMonth } from "../domain/dateUtils";
import type { Expense, Income } from "../domain/types";

type ChartPoint = {
  month: string;
  waitingBalance?: number; // only set for waiting-period months
  balance?: number; // only set for runway months (startingMonth to endMonth)
};

type ItemEditState = {
  name: string;
  amount: string;
};

function daysUntil(yyyymm: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m] = yyyymm.split("-").map(Number);
  const target = new Date(y, m - 1, 1);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonth(yyyymm: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", opts);
}

function eur(n: number, digits = 0): string {
  return `€${n.toLocaleString("de-DE", { minimumFractionDigits: digits })}`;
}

// ── Shared editable-list sub-components ─────────────────────────────────────

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
    <div className="mt-3 space-y-3 rounded-xl border border-hairline bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          autoFocus
          placeholder="Name"
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount (EUR)"
          value={state.amount}
          onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
          className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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
  onDelete: (id: string) => void;
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
      onDelete(item.id);
    }
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
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
        <p className="text-sm text-muted">No items yet.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-hairline bg-white">
        {items.map((item, i) =>
          editingId === item.id ? (
            <div key={item.id} className="space-y-3 border-hairline p-4" style={{ borderTopWidth: i > 0 ? 1 : 0 }}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  autoFocus
                  value={editState.name}
                  onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editState.amount}
                  onChange={(e) => setEditState((s) => ({ ...s, amount: e.target.value }))}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(item)}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={item.id}
              className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-paper/60"
              style={{ borderTopWidth: i > 0 ? 1 : 0, borderColor: "var(--color-hairline)" }}
            >
              <span className="text-sm font-medium text-ink">{item.name}</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm tabular-nums text-muted">
                  {eur(item.amount, 2)}
                  {unit}
                </span>
                <button
                  onClick={() => startEdit(item)}
                  className="text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100 hover:text-amber-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-sm text-negative opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
        {items.length > 0 && (
          <div
            className="flex items-center justify-between bg-paper/60 px-4 py-3"
            style={{ borderTopWidth: 1, borderColor: "var(--color-hairline)" }}
          >
            <span className="text-sm font-medium text-ink">Total</span>
            <span className="font-mono text-sm font-medium tabular-nums text-ink">
              {eur(total, 2)}
              {unit}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

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

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
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
        <p className="text-sm text-muted">No items yet.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-hairline bg-white">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-paper/60"
            style={{ borderTopWidth: i > 0 ? 1 : 0, borderColor: "var(--color-hairline)" }}
          >
            <span className="text-sm font-medium text-ink">{item.name}</span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm tabular-nums text-muted">{eur(item.amount, 2)}</span>
              <button
                onClick={() => onDelete(item.id)}
                className="text-sm text-negative opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length > 0 && (
          <div
            className="flex items-center justify-between bg-paper/60 px-4 py-3"
            style={{ borderTopWidth: 1, borderColor: "var(--color-hairline)" }}
          >
            <span className="text-sm font-medium text-ink">Total</span>
            <span className="font-mono text-sm font-medium tabular-nums text-ink">{eur(total, 2)}</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Overview route (Dashboard + Plan, combined) ─────────────────────────────

export default function Overview() {
  const settings = useStore((s) => s.settings);
  const expenses = useStore((s) => s.expenses);
  const incomes = useStore((s) => s.incomes);
  const storageUnavailable = useStore((s) => s.storageUnavailable);

  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const addIncome = useStore((s) => s.addIncome);
  const updateIncome = useStore((s) => s.updateIncome);
  const deleteIncome = useStore((s) => s.deleteIncome);

  const runway = useMemo(
    () => calculateRunway(settings, expenses, incomes),
    [settings, expenses, incomes],
  );

  const grossMonthlyExpenses = useMemo(() => computeMonthlyNetCost(expenses, []), [expenses]);
  const netMonthlyBurn = useMemo(
    () => computeMonthlyNetCost(expenses, incomes),
    [expenses, incomes],
  );
  const effectiveBalance = useMemo(
    () => computeEffectiveBalance(settings.startingBalance, incomes, expenses),
    [settings.startingBalance, incomes, expenses],
  );

  const cm = currentMonth();
  const isFutureStart = settings.startingMonth > cm;
  const daysUntilBurning = isFutureStart ? daysUntil(settings.startingMonth) : null;

  const allChartData = useMemo<ChartPoint[]>(() => {
    const points: ChartPoint[] = [];

    if (isFutureStart) {
      let month = cm;
      while (month < settings.startingMonth) {
        points.push({
          month: formatMonth(month, { month: "short", year: "2-digit" }),
          waitingBalance: settings.startingBalance,
        });
        month = addMonth(month);
      }
    }

    for (const m of runway.months) {
      const balance = Math.round(m.closingBalance);
      const bridgePoint =
        isFutureStart && m.month === settings.startingMonth
          ? { waitingBalance: Math.round(runway.effectiveBalance) }
          : {};
      points.push({
        month: formatMonth(m.month, { month: "short", year: "2-digit" }),
        ...bridgePoint,
        balance,
      });
    }

    return points;
  }, [cm, isFutureStart, settings.startingMonth, settings.startingBalance, runway.effectiveBalance, runway.months]);

  const lastChartPoint = allChartData.length > 0 ? allChartData[allChartData.length - 1] : null;

  const recurringExpenses = expenses.filter((e) => e.type === "recurringExpense");
  const oneTimeExpenses = expenses.filter((e) => e.type === "oneTimeExpense");
  const recurringIncomes = incomes.filter((i) => i.type === "recurringIncome");
  const oneTimeIncomes = incomes.filter((i) => i.type === "oneTimeIncome");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      {storageUnavailable && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          localStorage is unavailable — data will not persist across page reloads.
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr] lg:gap-14">
        {/* ── Left: simulation output, sticky ── */}
        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="space-y-8 rounded-2xl border border-hairline bg-white p-6 md:p-7">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Runway</p>
              <p className="font-display mt-2 text-7xl font-semibold tabular-nums leading-none text-ink">
                {runway.capExceeded ? "120+" : runway.remainingMonths}
              </p>
              <div className="runway-strip mt-4 w-full" />
              <p className="mt-3 text-sm text-muted">
                {runway.capExceeded ? "120+" : runway.totalMonths} months total · lasts through{" "}
                <span className="font-medium text-ink">
                  {runway.endMonth ? formatMonth(runway.endMonth, { month: "short", year: "numeric" }) : "—"}
                </span>
              </p>
              {isFutureStart && daysUntilBurning !== null && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  {daysUntilBurning} days until runway starts · {formatMonth(settings.startingMonth, { month: "long", year: "numeric" })}
                </p>
              )}
              {runway.overhang && runway.endMonth && (
                <p className="mt-3 text-xs text-muted">
                  {eur(runway.overhang.remainingBalance)} remaining · {eur(runway.overhang.shortfall)} short of{" "}
                  {formatMonth(addMonth(runway.endMonth), { month: "long" })}
                </p>
              )}
            </div>

            {allChartData.length > 0 && (
              <div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={allChartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "var(--font-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      formatter={(v: number) => [eur(v), "Balance"]}
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        borderRadius: 10,
                        border: "1px solid var(--color-hairline)",
                        boxShadow: "0 4px 16px rgba(18,19,26,.08)",
                      }}
                    />
                    <ReferenceLine y={0} stroke="var(--color-hairline)" strokeWidth={1} />
                    <Line
                      dataKey="waitingBalance"
                      stroke="#d1d5db"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="balance"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={
                        runway.overhang && lastChartPoint
                          ? (props: { cx?: number; cy?: number; index?: number }): React.ReactElement<SVGElement> => {
                              const isLast = props.index === allChartData.length - 1;
                              if (!isLast) return <g />;
                              const { cx, cy } = props;
                              return (
                                <circle
                                  key="overhang-dot"
                                  cx={cx}
                                  cy={cy}
                                  r={5}
                                  fill="var(--color-accent)"
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              );
                            }
                          : false
                      }
                      connectNulls
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-1 border-t border-hairline pt-5 font-mono text-xs text-muted">
              <div className="flex justify-between">
                <span>Gross monthly expenses</span>
                <span className="tabular-nums text-ink">{eur(grossMonthlyExpenses)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Net monthly burn</span>
                <span className="tabular-nums text-ink">{eur(netMonthlyBurn)}/mo</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-hairline pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Starting balance</span>
                <span className="font-mono tabular-nums text-ink">{eur(settings.startingBalance, 2)}</span>
              </div>
              {oneTimeIncomes.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-muted">{i.name}</span>
                  <span className="font-mono tabular-nums text-positive">+{eur(i.amount, 2)}</span>
                </div>
              ))}
              {oneTimeExpenses.map((e) => (
                <div key={e.id} className="flex justify-between">
                  <span className="text-muted">{e.name}</span>
                  <span className="font-mono tabular-nums text-negative">−{eur(e.amount, 2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-hairline pt-1.5 font-medium">
                <span className="text-ink">Effective balance</span>
                <span className="font-mono tabular-nums text-ink">{eur(effectiveBalance, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: simulation inputs, editable ── */}
        <div className="space-y-10">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Plan</h1>
            <p className="mt-1 text-sm text-muted">
              What goes in and out each month — edit it here and the runway updates instantly.
            </p>
          </div>

          <RecurringSection
            title="Monthly Expenses"
            unit="/mo"
            items={recurringExpenses}
            onAdd={(name, amount) => addExpense({ name, amount, type: "recurringExpense" })}
            onUpdate={(id, name, amount) => updateExpense(id, { name, amount })}
            onDelete={(id) => deleteExpense(id)}
          />

          <RecurringSection
            title="Monthly Income"
            unit="/mo"
            items={recurringIncomes}
            onAdd={(name, amount) => addIncome({ name, amount, type: "recurringIncome" })}
            onUpdate={(id, name, amount) => updateIncome(id, { name, amount })}
            onDelete={(id) => deleteIncome(id)}
          />

          <OneTimeSection
            title="One-time Expenses"
            items={oneTimeExpenses}
            onAdd={(name, amount) => addExpense({ name, amount, type: "oneTimeExpense" })}
            onDelete={(id) => deleteExpense(id)}
          />

          <OneTimeSection
            title="One-time Income"
            items={oneTimeIncomes}
            onAdd={(name, amount) => addIncome({ name, amount, type: "oneTimeIncome" })}
            onDelete={(id) => deleteIncome(id)}
          />
        </div>
      </div>
    </div>
  );
}
