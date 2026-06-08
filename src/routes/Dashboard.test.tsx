import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { store } from "../store";

// Pin time so currentMonth() and daysUntil() are deterministic
const JUNE_7_2026 = new Date("2026-06-07T00:00:00.000Z");

const RENT_CATEGORY = {
  id: "c1",
  name: "Rent",
  type: "expense" as const,
  plannedAmounts: [{ amount: 500, from: "2026-06" }],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(JUNE_7_2026);
  localStorage.clear();
  store.setState({
    categories: [RENT_CATEGORY],
    entries: [],
    settings: { startingBalance: 10000, startingMonth: "2026-06" },
    wizardCompleted: true,
    storageUnavailable: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

// ─── Runway counter ──────────────────────────────────────────────────────────

describe("runway counter", () => {
  it("shows runway months only when startingMonth is the current month", () => {
    renderDashboard();
    // 10 000 / 500 = 20 months
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows total months (waiting period + runway) when startingMonth is in the future", () => {
    store.setState({ settings: { startingBalance: 10000, startingMonth: "2026-08" } });
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
    store.setState({ settings: { startingBalance: 10000, startingMonth: "2026-08" } });
    renderDashboard();
    expect(screen.getByText(/days until savings start burning/)).toBeInTheDocument();
    expect(screen.getByText(/starts August 2026/)).toBeInTheDocument();
  });
});

// ─── Current-month detail during waiting period ───────────────────────────────

describe("current month during waiting period", () => {
  it("does not deduct planned expenses when startingMonth is in the future and nothing is logged", () => {
    store.setState({ settings: { startingBalance: 10000, startingMonth: "2026-08" } });
    renderDashboard();
    // Rent is €500/mo — if incorrectly applied, closing balance would be €9.500,00
    expect(screen.queryByText("€9.500,00")).not.toBeInTheDocument();
  });
});
