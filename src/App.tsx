import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import SetupWizard from "./components/SetupWizard";
import Dashboard from "./routes/Dashboard";
import Categories from "./routes/Categories";
import Settings from "./routes/Settings";
import { useStore } from "./store";

export default function App() {
  const wizardCompleted = useStore((s) => s.wizardCompleted);

  if (!wizardCompleted) {
    return <SetupWizard />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
