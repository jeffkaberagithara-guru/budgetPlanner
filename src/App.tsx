import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import { BudgetProvider } from "./context/BudgetContext";
import { ToastProvider } from "./context/ToastContext";
import { UiProvider } from "./context/UIContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Onboarding from "./components/Onboarding";
import LockGate from "./components/LockGate";
import Skeleton from "./components/Skeleton";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Reports = lazy(() => import("./pages/Reports"));
const Savings = lazy(() => import("./pages/Savings"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="max-w-4xl mx-auto w-full"
    >
      <div className="mb-6">
        <Skeleton className="h-6 w-44 mb-2" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-card mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card hidden lg:block" />
      </div>
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
        <LockGate>
          <BrowserRouter>
            <BudgetProvider>
              <SearchProvider>
                <ToastProvider>
                  <UiProvider>
                    {showOnboarding && (
                      <Onboarding onDone={handleOnboardingDone} />
                    )}
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/savings" element={<Savings />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/privacy" element={<Privacy />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </UiProvider>
                </ToastProvider>
              </SearchProvider>
            </BudgetProvider>
          </BrowserRouter>
        </LockGate>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
