import "@testing-library/jest-dom";

// recharts uses ResizeObserver which jsdom doesn't provide
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
