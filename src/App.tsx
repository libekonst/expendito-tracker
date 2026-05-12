import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Dashboard from "./routes/Dashboard";
import Month from "./routes/Month";
import Categories from "./routes/Categories";
import Settings from "./routes/Settings";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month/:yyyymm" element={<Month />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
