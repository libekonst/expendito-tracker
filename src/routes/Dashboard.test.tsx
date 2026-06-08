import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { store } from "../store";

// Pin time so currentMonth() and daysUntil() are deterministic
const JUNE_7_2026 = new Date("2026-06-07T00:00:00.000Z");
const NOW = "2026-06";
const FUTURE_START = "2026-08"; // 2 months ahead of NOW

const RENT_CATEGORY = {
  id: "c1",
  name: "Rent",
  type: "expense" as const,
  plannedAmount: 500,
};

// Capture what data and props are passed to Recharts components
const capturedLineChartData: unknown[] = [];
const capturedLineProps: Array<{ dataKey?: string; hasOwnData: boolean }> = [];

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
    LineChart: ({ data, children, ...rest }: any) => {
      capturedLineChartData.push(data);
      return (
        <div data-testid="line-chart" {...rest}>
          {children}
        </div>
      );
    },
    Line: ({ dataKey, data, ...rest }: any) => {
      capturedLineProps.push({ dataKey, hasOwnData: data !== undefined });
      return <div data-testid={`line-${dataKey}`} {...rest} />;
    },
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ReferenceLine: () => null,
  };
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

function shortMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(JUNE_7_2026);
  localStorage.clear();
  capturedLineChartData.length = 0;
  capturedLineProps.length = 0;
  store.setState({
    categories: [RENT_CATEGORY],
    entries: [],
    settings: { startingBalance: 10000, startingMonth: NOW },
    wizardCompleted: true,
    storageUnavailable: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Runway counter ──────────────────────────────────────────────────────────

describe("runway counter", () => {
  it("shows runway months only when startingMonth is the current month", () => {
    renderDashboard();
    // 10 000 / 500 = 20 months
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows total months (waiting period + runway) when startingMonth is in the future", () => {
    store.setState({ settings: { startingBalance: 10000, startingMonth: FUTURE_START } });
    renderDashboard();
    // 2 waiting months (Jun + Jul) + 20 runway months = 22
    expect(screen.getByText("22")).toBeInTheDocument();
  });
});

// ─── Future-start indicator ───────────────────────────────────────────────────

describe("future-start indicator", () => {
  it("is absent when startingMonth is the current month", () => {
    renderDashboard();
    expect(
      screen.queryByText(/days until savings start burning/),
    ).not.toBeInTheDocument();
  });

  it("shows a days-countdown and the start month when startingMonth is in the future", () => {
    store.setState({ settings: { startingBalance: 10000, startingMonth: FUTURE_START } });
    renderDashboard();
    expect(screen.getByText(/days until savings start burning/)).toBeInTheDocument();
    expect(screen.getByText(/starts August 2026/)).toBeInTheDocument();
  });
});

// ─── Current-month detail during waiting period ───────────────────────────────

describe("current month during waiting period", () => {
  it("does not deduct planned expenses when startingMonth is in the future and nothing is logged", () => {
    store.setState({ settings: { startingBalance: 10000, startingMonth: FUTURE_START } });
    renderDashboard();
    // Rent is €500/mo — if incorrectly applied, closing balance would be €9.500,00
    expect(screen.queryByText("€9.500,00")).not.toBeInTheDocument();
  });
});

// ─── Chart structure ──────────────────────────────────────────────────────────

describe("Dashboard chart — waiting period (future startingMonth)", () => {
  it("passes a unified data array to LineChart that includes waiting-period months", () => {
    store.setState({
      settings: { startingBalance: 5000, startingMonth: FUTURE_START },
      categories: [{ id: "cat1", name: "Rent", type: "expense", plannedAmount: 500 }],
    });

    renderDashboard();
    expect(capturedLineChartData.length).toBeGreaterThan(0);

    const data = capturedLineChartData[0] as Array<{
      month: string;
      waitingBalance?: number;
      solidBalance?: number;
      dashedBalance?: number;
    }>;

    // 2 pure waiting months (Jun, Jul) + 1 bridge at FUTURE_START = 3 entries with waitingBalance
    const waitingMonths = data.filter((d) => d.waitingBalance !== undefined);
    expect(waitingMonths.length).toBe(3);
    expect(waitingMonths[0].month).toBe(shortMonth(NOW));
    expect(waitingMonths[0].waitingBalance).toBe(5000);
  });

  it("each Line uses its own dataKey — no per-Line data prop", () => {
    store.setState({
      settings: { startingBalance: 5000, startingMonth: FUTURE_START },
      categories: [{ id: "cat1", name: "Rent", type: "expense", plannedAmount: 500 }],
    });

    renderDashboard();

    for (const lp of capturedLineProps) {
      expect(lp.hasOwnData).toBe(false);
    }
    expect(capturedLineProps.find((lp) => lp.dataKey === "waitingBalance")).toBeDefined();
    expect(capturedLineProps.find((lp) => lp.dataKey === "solidBalance")).toBeDefined();
    expect(capturedLineProps.find((lp) => lp.dataKey === "dashedBalance")).toBeDefined();
  });

  it("pure waiting months have only waitingBalance; bridge point connects both segments", () => {
    store.setState({
      settings: { startingBalance: 5000, startingMonth: FUTURE_START },
      categories: [{ id: "cat1", name: "Rent", type: "expense", plannedAmount: 500 }],
    });

    renderDashboard();
    const data = capturedLineChartData[0] as Array<{
      month: string;
      waitingBalance?: number;
      solidBalance?: number;
      dashedBalance?: number;
    }>;

    // Pure waiting months: only waitingBalance defined
    const pureWaiting = data.filter(
      (d) =>
        d.waitingBalance !== undefined &&
        d.solidBalance === undefined &&
        d.dashedBalance === undefined,
    );
    expect(pureWaiting.length).toBeGreaterThan(0);

    // Bridge point: waitingBalance AND a runway key at FUTURE_START
    const bridge = data.filter(
      (d) =>
        d.waitingBalance !== undefined &&
        (d.solidBalance !== undefined || d.dashedBalance !== undefined),
    );
    expect(bridge).toHaveLength(1);
    expect(bridge[0].month).toBe(shortMonth(FUTURE_START));
    expect(bridge[0].waitingBalance).toBe(5000);

    // Non-bridge runway months: no waitingBalance
    const runwayOnly = data.filter(
      (d) =>
        (d.solidBalance !== undefined || d.dashedBalance !== undefined) &&
        d.waitingBalance === undefined,
    );
    for (const rm of runwayOnly) {
      expect(rm.waitingBalance).toBeUndefined();
    }
  });

  it("bridge point is at startingMonth — dashed segment starts at same x-tick as waiting ends", () => {
    store.setState({
      settings: { startingBalance: 5000, startingMonth: FUTURE_START },
      categories: [{ id: "cat1", name: "Rent", type: "expense", plannedAmount: 500 }],
    });

    renderDashboard();
    const data = capturedLineChartData[0] as Array<{
      month: string;
      waitingBalance?: number;
      dashedBalance?: number;
    }>;

    const firstDashedIndex = data.findIndex((d) => d.dashedBalance !== undefined);
    const lastWaitingIndex = data.reduce(
      (last, d, i) => (d.waitingBalance !== undefined ? i : last),
      -1,
    );

    // Bridge: dashed starts at same index as last waiting point (shared x-tick)
    expect(firstDashedIndex).toBeGreaterThanOrEqual(lastWaitingIndex);
    expect(data[firstDashedIndex].month).toBe(shortMonth(FUTURE_START));
    expect(data[firstDashedIndex].waitingBalance).toBe(5000);
  });
});

describe("Dashboard chart — no waiting period (startingMonth is current month)", () => {
  it("has no waitingBalance entries when startingMonth is the current month", () => {
    renderDashboard();
    expect(capturedLineChartData.length).toBeGreaterThan(0);
    const data = capturedLineChartData[0] as Array<{ waitingBalance?: number }>;
    expect(data.filter((d) => d.waitingBalance !== undefined)).toHaveLength(0);
  });

  it("renders the Balance projection section", () => {
    renderDashboard();
    expect(screen.getByText("Balance projection")).toBeInTheDocument();
  });
});
