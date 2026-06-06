import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";
import { BudgetProvider } from "./context/BudgetContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Savings from "./pages/Savings";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <BudgetProvider>
          <SearchProvider>
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