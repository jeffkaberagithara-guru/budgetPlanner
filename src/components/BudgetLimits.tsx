import { useState } from "react";
import { Target, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getEffectiveLimit, getMonthData, monthKey } from "../utils/budget";
import { useToast } from "../hooks/useToast";
import { Category } from "../types";
import { EXPENSE_CATEGORIES, CATEGORY_DOT } from "../utils/categories";
import EmptyState from "./EmptyState";

export default function BudgetLimits() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const { transactions, budgetLimits } = getMonthData(state);
  const [selectedCat, setSelectedCat] = useState<Category>("Food");
  const [limitAmount, setLimitAmount] = useState("");
  const key = monthKey(state.currentYear, state.currentMonth);

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
    push({ message: `${selectedCat} limit set to ${fmt(limit)}`, tone: "success" });
  }

  function handleRemove(category: Category, limit: number) {
    dispatch({ type: "REMOVE_BUDGET_LIMIT", payload: { key, category } });
    push({
      message: `Removed ${category} limit`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () =>
          dispatch({
            type: "SET_BUDGET_LIMIT",
            payload: { key, limit: { category, limit } },
          }),
      },
    });
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-card shadow-card border border-gray-100 dark:border-gray-800/60 p-5 transition-colors">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-icon bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
          <Target size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Budget Limits
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Set spending caps per category
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-card p-4 mb-5">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Set a Limit
        </p>
        <div className="flex gap-2 mb-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value as Category)}
            className="flex-1 px-3 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition text-gray-800 dark:text-gray-100"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Limit amount"
            className="flex-1 px-3 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={handleSave}
            disabled={!limitAmount || parseFloat(limitAmount) <= 0}
            className="px-4 py-2.5 rounded-button bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-40"
          >
            Set
          </button>
        </div>
      </div>

      {budgetLimits.length === 0 ? (
        <EmptyState
          compact
          icon={Target}
          title="No budget limits set"
          description="Set limits to control your spending per category"
        />
      ) : (
        <div className="space-y-3">
          {budgetLimits.map(({ category, limit }) => {
            const spent = spending[category] ?? 0;
            const effective = getEffectiveLimit(state, key, category) ?? limit;
            const carried = effective - limit;
            const pct = Math.min(100, Math.round((spent / effective) * 100));
            const over = spent > effective;
            const warn = pct >= 80 && !over;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_DOT[category] ?? "bg-gray-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {category}
                        {carried > 0 && (
                          <span className="ml-2 text-xs font-medium text-teal-600 dark:text-teal-400">
                            +{fmt(carried)} rollover
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {over && (
                          <AlertTriangle
                            size={13}
                            className="text-rose-500"
                          />
                        )}
                        {!over && pct >= 80 && (
                          <AlertTriangle
                            size={13}
                            className="text-amber-500"
                          />
                        )}
                        {!over && pct < 80 && pct > 0 && (
                          <CheckCircle
                            size={13}
                            className="text-emerald-500"
                          />
                        )}
                        <span
                          className={`text-xs font-bold ${over ? "text-rose-500" : warn ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}
                        >
                          {fmt(spent)} / {fmt(effective)}
                        </span>
                        <button
                          onClick={() => handleRemove(category, limit)}
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
                          : "bg-teal-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <p className="text-xs text-rose-500 font-medium ml-4">
                    Over budget by {fmt(spent - effective)}
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
