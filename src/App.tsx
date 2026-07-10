import { Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Overview from "./routes/Overview";
import Settings from "./routes/Settings";

export default function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/plan" element={<Navigate to="/" replace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
