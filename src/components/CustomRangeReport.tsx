import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { format } from "date-fns";
import { useBudget, useFormat } from "../hooks/useBudget";
import { typeTotals } from "../utils/insights";
import { Transaction } from "../types";
import EmptyState from "./EmptyState";

function monthOptions(currentYear: number): {
  value: string;
  label: string;
}[] {
  const options: { value: string; label: string }[] = [];
  for (const y of [currentYear - 1, currentYear]) {
    for (let m = 0; m < 12; m++) {
      const value = `${y}-${String(m + 1).padStart(2, "0")}`;
      options.push({ value, label: `${format(new Date(y, m, 1), "MMM")} ${y}` });
    }
  }
  return options;
}

export default function CustomRangeReport() {
  const { state } = useBudget();
  const fmt = useFormat();
  const currentKey = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, "0")}`;
  const options = useMemo(() => monthOptions(state.currentYear), [state.currentYear]);

  const [fromKey, setFromKey] = useState(options[options.length - 4].value);
  const [toKey, setToKey] = useState(currentKey);

  const result = useMemo(() => {
    const allTxs: Transaction[] = [];
    let monthsCounted = 0;
    for (const key of Object.keys(state.data)) {
      if (key < fromKey || key > toKey) continue;
      const txs = state.data[key].transactions;
      if (txs.length === 0) continue;
      monthsCounted++;
      allTxs.push(...txs);
    }
    const totals = typeTotals(allTxs);
    const catMap: Record<string, number> = {};
    for (const t of allTxs) {
      if (t.type !== "expense") continue;
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    }
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      ...totals,
      balance: totals.income - totals.expense - totals.saved,
      monthsCounted,
      txCount: allTxs.length,
      topCategories,
    };
  }, [state.data, fromKey, toKey]);

  const normalizedFrom = fromKey <= toKey ? fromKey : toKey;
  const normalizedTo = fromKey <= toKey ? toKey : fromKey;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Custom Range Report
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Aggregate any span of months
          </p>
        </div>
        <SlidersHorizontal size={15} className="text-gray-300 shrink-0" />
      </div>

      <div className="flex flex-wrap items-end gap-2 mb-5">
        <label className="block">
          <span className="block text-[11px] font-semibold text-gray-400 mb-1">
            From
          </span>
          <select
            value={fromKey}
            onChange={(e) => setFromKey(e.target.value)}
            className="px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold text-gray-400 mb-1">
            To
          </span>
          <select
            value={toKey}
            onChange={(e) => setToKey(e.target.value)}
            className="px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {(fromKey !== options[options.length - 4].value ||
          toKey !== currentKey) && (
          <button
            onClick={() => {
              setFromKey(options[options.length - 4].value);
              setToKey(currentKey);
            }}
            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 pb-2.5 transition"
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {result.txCount === 0 ? (
        <EmptyState
          compact
          icon={SlidersHorizontal}
          title="Nothing in this range"
          description="Try widening the range — data exists only in months you've tracked"
        />
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {normalizedFrom} → {normalizedTo} · {result.monthsCounted} active
            month{result.monthsCounted !== 1 ? "s" : ""} ·{" "}
            {result.txCount} transactions
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { label: "Income", value: result.income, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Expenses", value: result.expense, color: "text-rose-500" },
              { label: "To Goals", value: result.saved, color: "text-primary dark:text-primary-light" },
              { label: "Net", value: result.balance, color: result.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-500" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-100 dark:border-gray-800/60 px-3 py-2.5"
              >
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {label}
                </p>
                <p className={`text-sm font-black truncate ${color}`}>
                  {fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {result.topCategories.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Top categories
              </p>
              {result.topCategories.map(([cat, amt]) => {
                const pct =
                  result.expense > 0
                    ? Math.round((amt / result.expense) * 100)
                    : 0;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {cat}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="w-9 text-right text-[11px] text-gray-400 tabular-nums">
                        {pct}%
                      </span>
                      <span className="text-xs font-black text-gray-800 dark:text-gray-100 tabular-nums">
                        {fmt(amt)}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
