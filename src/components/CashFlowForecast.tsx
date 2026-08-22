import { useMemo } from "react";
import { Compass, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthTotals, monthKey } from "../utils/budget";
import { unpostedRecurringForMonth } from "../utils/insights";

export default function CashFlowForecast() {
  const { state } = useBudget();
  const fmt = useFormat();
  const key = monthKey(state.currentYear, state.currentMonth);
  const now = new Date();
  const monthLabel = format(new Date(state.currentYear, state.currentMonth, 1), "MMMM");

  const isCurrentRealMonth =
    now.getFullYear() === state.currentYear && now.getMonth() === state.currentMonth;

  const forecast = useMemo(() => {
    const posted = getMonthTotals(state.data[key]);
    const upcoming = isCurrentRealMonth
      ? unpostedRecurringForMonth(state, key)
      : { income: 0, expenses: 0, count: 0 };
    return {
      soFarBalance: posted.balance,
      expectedIncome: upcoming.income,
      expectedExpenses: upcoming.expenses,
      pendingCount: upcoming.count,
      projected: posted.balance + upcoming.income - upcoming.expenses,
      hasActivity:
        (state.data[key]?.transactions?.length ?? 0) > 0 || upcoming.count > 0,
    };
  }, [state, key, isCurrentRealMonth]);

  if (!forecast.hasActivity) {
    return (
      <div>
        <Header monthLabel={monthLabel} />
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
          No activity this month yet — the forecast appears once you log
          transactions or have recurring items.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Header monthLabel={monthLabel} />

      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Projected end-of-month balance
          </p>
          <p
            className={`text-2xl font-black tabular-nums ${
              forecast.projected >= 0
                ? "text-gray-900 dark:text-white"
                : "text-rose-500"
            }`}
          >
            {fmt(forecast.projected)}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            forecast.projected >= forecast.soFarBalance
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-900/30 text-rose-500"
          }`}
        >
          {fmt(forecast.projected - forecast.soFarBalance)} more to come
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Balance so far" value={fmt(forecast.soFarBalance)} />
        {isCurrentRealMonth ? (
          <>
            <Row
              label={`Expected income still due (${forecast.pendingCount} item${forecast.pendingCount !== 1 ? "s" : ""})`}
              value={`+${fmt(forecast.expectedIncome)}`}
              tone="positive"
            />
            <Row
              label="Expected bills still due"
              value={`-${fmt(forecast.expectedExpenses)}`}
              tone="negative"
            />
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-1">
            <CalendarClock size={12} />
            Forecasting only works for the current real month — you're viewing{" "}
            {monthLabel}.
          </p>
        )}
      </div>

      {isCurrentRealMonth &&
        forecast.pendingCount === 0 &&
        state.recurringTemplates.some((t) => t.frequency === "monthly") && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
            All monthly recurring items already posted this month.
          </p>
        )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`font-black tabular-nums ${
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
              ? "text-rose-500"
              : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Header({ monthLabel }: { monthLabel?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        Cash-Flow Forecast
        <Compass size={13} className="text-primary dark:text-primary-light" />
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Where you'll land by the end of {monthLabel ?? "this month"}
      </p>
    </div>
  );
}
