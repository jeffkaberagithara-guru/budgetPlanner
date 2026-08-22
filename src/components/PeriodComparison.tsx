import { useMemo } from "react";
import { Minus } from "lucide-react";
import { format } from "date-fns";
import { useBudget, useFormat } from "../hooks/useBudget";
import {
  getMonthData,
  getMonthTotals,
  monthKey,
  previousKey,
} from "../utils/budget";

interface Row {
  label: string;
  current: number;
  previous: number | null;
}

export default function PeriodComparison() {
  const { state } = useBudget();
  const fmt = useFormat();

  const key = monthKey(state.currentYear, state.currentMonth);
  const prevKey = previousKey(key);

  const rows: Row[] = useMemo(() => {
    const cur = getMonthTotals(getMonthData(state));
    const prevMonth = state.data[prevKey];
    const hasPrev =
      prevMonth !== undefined && prevMonth.transactions.length > 0;
    const prev = hasPrev ? getMonthTotals(prevMonth) : null;

    return [
      { label: "Income", current: cur.income, previous: prev?.income ?? null },
      {
        label: "Expenses",
        current: cur.expense,
        previous: prev?.expense ?? null,
      },
      {
        label: "Balance",
        current: cur.balance,
        previous: prev?.balance ?? null,
      },
    ];
  }, [state, prevKey]);

  const prevLabel = format(
    new Date(
      Number(prevKey.split("-")[0]),
      Number(prevKey.split("-")[1]) - 1,
      1,
    ),
    "MMMM",
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          vs Last Month
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Compared to {prevLabel}
        </p>
      </div>
      <div className="space-y-3">
        {rows.map(({ label, current, previous }) => {
          let delta: number | null = null;
          if (previous !== null && previous !== 0) {
            delta = Math.round(((current - previous) / Math.abs(previous)) * 100);
          }
          const goodDirection = label === "Expenses" ? -1 : 1;
          const tone =
            delta === null || delta === 0
              ? "text-gray-400 dark:text-gray-500"
              : Math.sign(delta) === goodDirection
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-500";

          return (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                  {fmt(current)}
                </span>
                <span className={`flex items-center gap-1 text-xs font-bold w-20 justify-end ${tone}`}>
                  {delta === null ? (
                    <>
                      <Minus size={11} /> no data
                    </>
                  ) : (
                    <>
                      {delta > 0 ? "+" : ""}
                      {delta}% vs {prevLabel.slice(0, 3)}
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
