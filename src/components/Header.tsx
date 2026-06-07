import { Search, Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClearDataButton from "./ClearDataButton";
import ThemeToggle from "./ThemeToggle";
import NotificationsPanel from "./NotificationsPanel";
import { useSearch } from "../context/SearchContext";
import { useBudget, getMonthData } from "../context/BudgetContext";

export default function Header() {
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { state } = useBudget();
  const { transactions, savingsGoal } = getMonthData(state);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const spendingPct = income > 0 ? Math.round((expense / income) * 100) : 0;
  const hasAlert =
    spendingPct > 70 || transactions.length === 0 || savingsGoal > 0;

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    if (e.target.value.length > 0) navigate("/transactions");
  }

  return (
    <>
      <header className="h-14 md:h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-colors">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 w-48 md:w-72">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search transactions..."
            className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none w-full placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">B</span>
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
            <Bell size={18} className="text-gray-500 dark:text-gray-400" />
            {hasAlert && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            )}
          </button>
          <div
            onClick={() => navigate("/settings")}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs md:text-sm font-bold cursor-pointer hover:opacity-90 transition"
          >
            B
          </div>
        </div>
      </header>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}