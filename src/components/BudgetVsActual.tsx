import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ReceiptText } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getEffectiveLimit, getMonthData, monthKey } from "../utils/budget";
import { CATEGORY_DOT } from "../utils/categories";
import { Category } from "../types";
import { formatDate } from "../utils/date";
import EmptyState from "./EmptyState";

export default function BudgetVsActual() {
  const { state } = useBudget();
  const fmt = useFormat();
  const [expanded, setExpanded] = useState<string | null>(null);

  const key = monthKey(state.currentYear, state.currentMonth);
  const { budgetLimits, transactions } = getMonthData(state);

  const rows = useMemo(() => {
    const spentByCat = new Map<Category, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      spentByCat.set(
        t.category as Category,
        (spentByCat.get(t.category as Category) ?? 0) + t.amount,
      );
    }
    const categories = new Set<Category>([
      ...budgetLimits.map((l) => l.category),
      ...spentByCat.keys(),
    ]);
    return [...categories]
      .map((category) => {
        const base =
          budgetLimits.find((l) => l.category === category)?.limit ?? null;
        const effective = getEffectiveLimit(state, key, category);
        return {
          category,
          spent: spentByCat.get(category) ?? 0,
          base,
          effective,
          rollover:
            effective !== null && base !== null ? effective - base : 0,
        };
      })
      .sort((a, b) => {
        if (a.spent !== b.spent) return b.spent - a.spent;
        return (b.base ?? -1) - (a.base ?? -1);
      });
  }, [state, key, budgetLimits, transactions]);

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={ReceiptText}
        title="Nothing to compare yet"
        description="Add expenses or set category limits to see budget vs actual"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Budget vs Actual
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tap a category to see its transactions
          </p>
        </div>
        {state.settings.rollover && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
            Rollover on
          </span>
        )}
      </div>

      <div className="space-y-3">
        {rows.map(
          ({ category, spent, effective, rollover }) => {
            const limit = effective;
            const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : null;
            const over = limit !== null && spent > limit;
            const warn = pct !== null && pct >= 80 && !over;
            const isOpen = expanded === category;
            const catTxs = transactions
              .filter((t) => t.type === "expense" && t.category === category)
              .sort((a, b) => b.date.localeCompare(a.date));

            return (
              <div
                key={category}
                className="rounded-xl border border-gray-100 dark:border-gray-800/60 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : category)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2.5 px-3.5 pt-3 pb-1.5 text-left group"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_DOT[category] ?? "bg-gray-400"}`}
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate">
                    {category}
                    {rollover > 0 && (
                      <span className="ml-2 text-xs font-medium text-teal-600 dark:text-teal-400">
                        +{fmt(rollover)} rollover
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs font-bold shrink-0 tabular-nums ${
                      over
                        ? "text-rose-500"
                        : warn
                          ? "text-amber-500"
                          : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {limit !== null
                      ? `${fmt(spent)} / ${fmt(limit)}`
                      : fmt(spent)}
                  </span>
                  {isOpen ? (
                    <ChevronDown
                      size={15}
                      className="text-gray-400 shrink-0"
                    />
                  ) : (
                    <ChevronRight
                      size={15}
                      className="text-gray-300 group-hover:text-gray-500 shrink-0 transition"
                    />
                  )}
                </button>
                <div className="px-3.5 pb-3">
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-4 mr-6">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        over
                          ? "bg-rose-500"
                          : warn
                            ? "bg-amber-400"
                            : limit !== null
                              ? "bg-teal-500"
                              : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                  {over && (
                    <p className="text-xs text-rose-500 font-medium mt-1.5 ml-4">
                      Over by {fmt(spent - (limit ?? 0))}
                    </p>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-gray-50 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-800/40 px-3.5 py-2">
                    {catTxs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 pl-4">
                        No transactions in this category yet.
                      </p>
                    ) : (
                      catTxs.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100/80 dark:border-gray-800/60 last:border-0"
                        >
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                            {formatDate(t.date, "MMM d")} · {t.name}
                          </span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 shrink-0">
                            {fmt(t.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
