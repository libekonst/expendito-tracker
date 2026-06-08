import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { store } from "../store";
import MonthArchive from "./MonthArchive";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-07T00:00:00.000Z"));
  localStorage.clear();
  store.setState({
    settings: { startingBalance: 3000, startingMonth: "2025-01" },
    categories: [
      {
        id: "cat-1",
        name: "Rent",
        type: "expense",
        plannedAmount: 1000,
      },
    ],
    entries: [],
    wizardCompleted: true,
    storageUnavailable: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MonthArchive", () => {
  it("renders MonthArchive without crashing", () => {
    render(
      <MemoryRouter>
        <MonthArchive />
      </MemoryRouter>,
    );
    expect(screen.getByText("Month Archive")).toBeInTheDocument();
  });

  it("shows past months list when past months exist", () => {
    render(
      <MemoryRouter>
        <MonthArchive />
      </MemoryRouter>,
    );
    // startingMonth is 2025-01, system time is 2026-06-07, so there are past months
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});
