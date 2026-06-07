import { useState } from "react";
import { Target, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useBudget, getMonthData, monthKey } from "../context/BudgetContext";
import { Category } from "../types";
import { formatKES } from "../utils/format";

const EXPENSE_CATS: Category[] = [
  "Housing",
  "Food",
  "Transport",
  "Health",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Education",
  "Other",
];

const CAT_COLORS: Record<string, string> = {
  Housing: "bg-rose-500",
  Food: "bg-orange-500",
  Transport: "bg-amber-500",
  Health: "bg-pink-500",
  Entertainment: "bg-purple-500",
  Shopping: "bg-indigo-500",
  Utilities: "bg-blue-500",
  Education: "bg-lime-500",
  Other: "bg-gray-400",
};

export default function BudgetLimits() {
  const { state, dispatch } = useBudget();
  const { transactions, budgetLimits } = getMonthData(state);
  const [selectedCat, setSelectedCat] = useState<Category>("Food");
  const [limitAmount, setLimitAmount] = useState("");
  const key = monthKey(state.currentYear, state.currentMonth);

  // Spending per category this month
  const spending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    });

  function handleSave() {
    const limit = parseFloat(limitAmount);
    if (!limit || limit <= 0) return;
    dispatch({
      type: "SET_BUDGET_LIMIT",
      payload: { key, limit: { category: selectedCat, limit } },
    });
    setLimitAmount("");
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
          <Target size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Budget Limits
          </h2>
          <p className="text-xs text-gray-400">
            Set spending caps per category
          </p>
        </div>
      </div>

      {/* Add limit form */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Set a Limit
        </p>
        <div className="flex gap-2 mb-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value as Category)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition text-gray-800 dark:text-gray-100"
          >
            {EXPENSE_CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="KES limit"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={handleSave}
            disabled={!limitAmount || parseFloat(limitAmount) <= 0}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-40"
          >
            Set
          </button>
        </div>
      </div>

      {/* Limits list */}
      {budgetLimits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">🎯</span>
          <p className="text-sm font-semibold text-gray-400">
            No budget limits set
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Set limits to control your spending per category
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetLimits.map(({ category, limit }) => {
            const spent = spending[category] ?? 0;
            const pct = Math.min(100, Math.round((spent / limit) * 100));
            const over = spent > limit;
            const warn = pct >= 80 && !over;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${CAT_COLORS[category] ?? "bg-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        {over && (
                          <AlertTriangle size={13} className="text-rose-500" />
                        )}
                        {!over && pct >= 80 && (
                          <AlertTriangle size={13} className="text-amber-500" />
                        )}
                        {!over && pct < 80 && pct > 0 && (
                          <CheckCircle size={13} className="text-emerald-500" />
                        )}
                        <span
                          className={`text-xs font-bold ${over ? "text-rose-500" : warn ? "text-amber-500" : "text-gray-400"}`}
                        >
                          {formatKES(spent)} / {formatKES(limit)}
                        </span>
                        <button
                          onClick={() =>
                            dispatch({
                              type: "REMOVE_BUDGET_LIMIT",
                              payload: { key, category },
                            })
                          }
                          aria-label="Remove limit"
                          className="p-1 rounded-lg text-gray-300 hover:text-rose-500 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      over
                        ? "bg-rose-500"
                        : warn
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <p className="text-xs text-rose-500 font-medium ml-4">
                    ⚠️ Over budget by {formatKES(spent - limit)}!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}