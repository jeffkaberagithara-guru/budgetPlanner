import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import { BudgetProvider } from "./context/BudgetContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Savings from "./pages/Savings";
import Settings from "./pages/Settings";
import Onboarding from "./components/Onboarding";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("budgetbold-onboarded");
    if (!seen) setShowOnboarding(true);
  }, []);

  function handleOnboardingDone() {
    localStorage.setItem("budgetbold-onboarded", "true");
    setShowOnboarding(false);
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <BudgetProvider>
          <SearchProvider>
            {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </SearchProvider>
        </BudgetProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}