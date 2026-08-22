import { Search, Bell, Landmark, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ClearDataButton from "./ClearDataButton";
import ThemeToggle from "./ThemeToggle";
import NotificationsPanel from "./NotificationsPanel";
import { useSearch } from "../hooks/useSearch";
import { useBudget } from "../hooks/useBudget";
import { getMonthData } from "../utils/budget";
import { lowBalanceAccounts } from "../utils/accounts";
import { spendingAlert, typeTotals } from "../utils/insights";
import { loadProfile } from "../utils/profile";

export default function Header() {
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profile] = useState(() => loadProfile());
  const { state } = useBudget();
  const { transactions } = getMonthData(state);

  const hasAlert = useMemo(() => {
    if (lowBalanceAccounts(state).length > 0) return true;
    if (!(state.settings.spendingAlerts ?? true)) return false;
    const { income, expense } = typeTotals(transactions);
    return spendingAlert(income, expense) !== null;
  }, [state, transactions]);

  const avatarInitial = (profile.name.trim()[0] ?? "B").toUpperCase();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    if (e.target.value.length > 0) navigate("/transactions");
  }

  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notifOpen]);

  return (
    <>
      <header className="h-14 md:h-16 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-colors">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-2 w-48 md:w-72">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            data-search
            value={query}
            onChange={handleSearch}
            placeholder="Search transactions..."
            className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none w-full placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-bold"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Landmark size={14} className="text-white" />
          </div>
          <span className="font-black text-gray-900 dark:text-white text-sm">
            BudgetBold
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <div className="hidden md:block">
            <ClearDataButton />
          </div>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Bell
              size={18}
              className="text-gray-500 dark:text-gray-400"
            />
            {hasAlert && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => navigate("/settings")}
            aria-label="Open settings"
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary flex items-center justify-center text-white text-xs md:text-sm font-bold hover:bg-primary-dark transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {avatarInitial}
          </button>
        </div>
      </header>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}
