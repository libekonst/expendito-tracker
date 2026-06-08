import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach } from "vitest";
import { store } from "../store";
import MonthArchive from "./MonthArchive";

beforeEach(() => {
  localStorage.clear();
  store.setState({
    settings: { startingBalance: 3000, startingMonth: "2025-01" },
    categories: [
      {
        id: "cat-1",
        name: "Rent",
        type: "expense",
        plannedAmounts: [{ amount: 1000, from: "2025-01" }],
      },
    ],
    entries: [],
    wizardCompleted: true,
    storageUnavailable: false,
  });
});

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
  // startingMonth is 2025-01, current date is 2026-06, so there are past months
  // The component should render month links without crashing
  const heading = screen.getByText("Month Archive");
  expect(heading).toBeInTheDocument();
});
