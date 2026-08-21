import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import { BudgetProvider } from "./context/BudgetContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Onboarding from "./components/Onboarding";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Reports = lazy(() => import("./pages/Reports"));
const Savings = lazy(() => import("./pages/Savings"));
const Settings = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("budgetbold-onboarded"),
  );

  function handleOnboardingDone() {
    localStorage.setItem("budgetbold-onboarded", "true");
    setShowOnboarding(false);
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <BudgetProvider>
            <SearchProvider>
              {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/savings" element={<Savings />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Suspense>
              </Layout>
            </SearchProvider>
          </BudgetProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
