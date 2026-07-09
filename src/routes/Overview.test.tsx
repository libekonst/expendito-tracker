import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Overview from "./Overview";
import { store } from "../store";

// Pin time so currentMonth() and daysUntil() are deterministic
const JUNE_7_2026 = new Date("2026-06-07T00:00:00.000Z");
const NOW = "2026-06";
const FUTURE_START = "2026-08"; // 2 months ahead of NOW

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
    ReferenceDot: () => null,
  };
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Overview />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(JUNE_7_2026);
  localStorage.clear();
  capturedLineChartData.length = 0;
  capturedLineProps.length = 0;
  store.setState({
    expenses: [{ id: "e1", name: "Rent", type: "recurringExpense", amount: 500 }],
    incomes: [],
    settings: { startingBalance: 10000, startingMonth: NOW },
    wizardCompleted: true,
    storageUnavailable: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Runway headline ──────────────────────────────────────────────────────────

describe("remaining months hero", () => {
  it("shows remainingMonths as the large hero number", () => {
    // balance=10000, expense €500/month, startingMonth=NOW (2026-06)
    // Engine: months 2026-06 through 2026-01+20 = 2028-01 (20 total)
    // remainingMonths = months strictly after 2026-06 = 19
    renderDashboard();
    expect(screen.getByText("19")).toBeInTheDocument();
  });
});

describe("total months secondary", () => {
  it("secondary text contains totalMonths months total", () => {
    renderDashboard();
    expect(screen.getByText(/20 months total/)).toBeInTheDocument();
  });
});

describe("end month secondary", () => {
  it("secondary text contains lasts through and formatted endMonth", () => {
    renderDashboard();
    expect(screen.getByText(/lasts through/)).toBeInTheDocument();
  });
});

// ─── Waiting period ───────────────────────────────────────────────────────────

describe("waiting period countdown", () => {
  it("shows days until runway starts and start month when startingMonth is future", () => {
    store.setState({
      settings: { startingBalance: 10000, startingMonth: FUTURE_START },
    });
    renderDashboard();
    expect(screen.getByText(/days until runway starts/)).toBeInTheDocument();
    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
  });
});

describe("no waiting period indicator", () => {
  it("does not show days until runway starts when startingMonth is current month", () => {
    renderDashboard();
    expect(screen.queryByText(/days until runway starts/)).not.toBeInTheDocument();
  });
});

// ─── Overhang block ───────────────────────────────────────────────────────────

describe("overhang block shown", () => {
  it("shows overhang block when there is a partial month remaining", () => {
    // balance=2500, expense €1000: month 1 closes at 1500, month 2 closes at 500,
    // month 3 would close at -500 → overhang: remainingBalance=500, shortfall=500
    store.setState({
      expenses: [{ id: "e1", name: "Rent", type: "recurringExpense", amount: 1000 }],
      incomes: [],
      settings: { startingBalance: 2500, startingMonth: NOW },
    });
    renderDashboard();
    expect(screen.getByText(/€500 remaining/)).toBeInTheDocument();
    expect(screen.getByText(/€500 short of/)).toBeInTheDocument();
  });
});

describe("overhang block hidden", () => {
  it("does not show overhang block when balance divides evenly", () => {
    // balance=2000, expense €1000: exactly 2 months, no overhang
    store.setState({
      expenses: [{ id: "e1", name: "Rent", type: "recurringExpense", amount: 1000 }],
      incomes: [],
      settings: { startingBalance: 2000, startingMonth: NOW },
    });
    renderDashboard();
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    expect(screen.queryByText(/short of/)).not.toBeInTheDocument();
  });
});

// ─── Total monthly expenses ───────────────────────────────────────────────────

describe("total monthly expenses shown", () => {
  it("shows gross recurring expense total (excludes one-time expenses)", () => {
    store.setState({
      expenses: [
        { id: "e1", name: "Rent", type: "recurringExpense", amount: 500 },
        { id: "e2", name: "Laptop", type: "oneTimeExpense", amount: 1000 },
      ],
      incomes: [],
      settings: { startingBalance: 10000, startingMonth: NOW },
    });
    renderDashboard();
    // Should show €500/mo (only recurring, not the one-time €1000)
    expect(screen.getByText("Gross monthly expenses")).toBeInTheDocument();
    expect(screen.getAllByText("€500/mo").length).toBeGreaterThan(0);
  });
});

// ─── Chart structure ──────────────────────────────────────────────────────────

describe("chart has no dashedBalance line", () => {
  it("does not render a line-dashedBalance data-testid", () => {
    renderDashboard();
    expect(document.querySelector('[data-testid="line-dashedBalance"]')).toBeNull();
  });
});

describe("chart has balance line", () => {
  it("renders a line-balance data-testid", () => {
    renderDashboard();
    expect(document.querySelector('[data-testid="line-balance"]')).not.toBeNull();
  });
});

describe("chart has waitingBalance during waiting period", () => {
  it("waitingBalance data is present in chart when startingMonth is future", () => {
    store.setState({
      expenses: [{ id: "e1", name: "Rent", type: "recurringExpense", amount: 500 }],
      incomes: [],
      settings: { startingBalance: 10000, startingMonth: FUTURE_START },
    });
    renderDashboard();
    expect(capturedLineChartData.length).toBeGreaterThan(0);
    const data = capturedLineChartData[0] as Array<{ waitingBalance?: number }>;
    const withWaiting = data.filter((d) => d.waitingBalance !== undefined);
    expect(withWaiting.length).toBeGreaterThan(0);
  });
});
