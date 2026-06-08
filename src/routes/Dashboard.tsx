import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../store";
import { calculateRunway, computeMonthlyNetCost } from "../domain/runwayEngine";

type ChartPoint = {
  month: string;
  waitingBalance?: number; // only set for waiting-period months
  balance?: number;        // only set for runway months (startingMonth to endMonth)
};

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function addMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function daysUntil(yyyymm: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m] = yyyymm.split("-").map(Number);
  const target = new Date(y, m - 1, 1);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function shortMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
}

function longMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function formatEndMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function monthName(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "long",
  });
}

export default function Dashboard() {
  const settings = useStore((s) => s.settings);
  const expenses = useStore((s) => s.expenses);
  const incomes = useStore((s) => s.incomes);
  const storageUnavailable = useStore((s) => s.storageUnavailable);

  const runway = useMemo(
    () => calculateRunway(settings, expenses, incomes),
    [settings, expenses, incomes],
  );

  const monthlyExpenses = useMemo(
    () => computeMonthlyNetCost(expenses, []),
    [expenses],
  );

  const cm = currentMonth();
  const isFutureStart = settings.startingMonth > cm;
  const daysUntilBurning = isFutureStart ? daysUntil(settings.startingMonth) : null;

  // Build chart data: waiting-period months (gray flat line) then runway months (indigo line).
  // The startingMonth data point carries BOTH keys to bridge the two segments visually.
  const allChartData = useMemo<ChartPoint[]>(() => {
    const points: ChartPoint[] = [];

    if (isFutureStart) {
      let month = cm;
      while (month < settings.startingMonth) {
        points.push({ month: shortMonth(month), waitingBalance: settings.startingBalance });
        month = addMonth(month);
      }
    }

    for (const m of runway.months) {
      const balance = Math.round(m.closingBalance);
      const bridgePoint =
        isFutureStart && m.month === settings.startingMonth
          ? { waitingBalance: settings.startingBalance }
          : {};
      points.push({ month: shortMonth(m.month), ...bridgePoint, balance });
    }

    return points;
  }, [cm, isFutureStart, settings.startingMonth, settings.startingBalance, runway.months]);

  // Last data point month label for the overhang dot
  const lastChartPoint = allChartData.length > 0 ? allChartData[allChartData.length - 1] : null;

  return (
    <div className="space-y-10">
      {storageUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          localStorage is unavailable — data will not persist across page reloads.
        </div>
      )}

      {/* Runway headline */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Runway
        </p>
        <p className="mt-2 text-6xl font-bold tabular-nums text-gray-900">
          {runway.remainingMonths}
        </p>
        <p className="mt-1 text-base text-gray-500">
          {runway.totalMonths} months total · lasts through{" "}
          {runway.endMonth ? formatEndMonth(runway.endMonth) : "—"}
        </p>
        {isFutureStart && daysUntilBurning !== null && (
          <p className="mt-2 text-sm font-medium text-amber-600">
            {daysUntilBurning} days until runway starts · starts{" "}
            {longMonth(settings.startingMonth)}
          </p>
        )}
      </div>

      {/* Overhang block */}
      {runway.overhang && runway.endMonth && (
        <div className="text-center text-sm text-gray-500">
          €{runway.overhang.remainingBalance.toLocaleString("de-DE", { minimumFractionDigits: 0 })} remaining · €{runway.overhang.shortfall.toLocaleString("de-DE", { minimumFractionDigits: 0 })} short of{" "}
          {monthName(addMonth(runway.endMonth))}
        </div>
      )}

      {/* Total monthly expenses */}
      <div className="text-sm text-gray-500">
        Total monthly expenses: €{monthlyExpenses.toLocaleString("de-DE", { minimumFractionDigits: 0 })}/month
      </div>

      {/* Balance chart */}
      {allChartData.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-gray-500">Balance projection</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={allChartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(v: number) => [
                  `€${v.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`,
                  "Balance",
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                }}
              />
              <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
              {/* Waiting period — flat gray line */}
              <Line
                dataKey="waitingBalance"
                stroke="#d1d5db"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              {/* Runway months — continuous indigo line */}
              <Line
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={2}
                dot={runway.overhang && lastChartPoint
                  ? (props: any) => {
                      const isLast = props.index === allChartData.length - 1;
                      if (!isLast) return <g />;
                      const { cx, cy } = props;
                      return (
                        <circle
                          key="overhang-dot"
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#6366f1"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                  : false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
