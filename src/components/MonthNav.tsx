import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useBudget } from "../hooks/useBudget";
import { monthKey } from "../utils/budget";

export default function MonthNav() {
  const { state, dispatch } = useBudget();
  const { currentYear, currentMonth } = state;
  const date = new Date(currentYear, currentMonth, 1);

  function change(dir: number) {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    dispatch({ type: "CHANGE_MONTH", payload: { year: y, month: m } });
  }

  const isCurrentMonth =
    monthKey(currentYear, currentMonth) ===
    monthKey(new Date().getFullYear(), new Date().getMonth());

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800/60 rounded-xl px-1 py-1 shadow-card">
      <button
        onClick={() => change(-1)}
        aria-label="Previous month"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 min-w-24 md:min-w-32 text-center px-1">
        {format(date, "MMM yyyy")}
      </span>
      <button
        onClick={() => change(1)}
        disabled={isCurrentMonth}
        aria-label="Next month"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => {
            const now = new Date();
            dispatch({
              type: "CHANGE_MONTH",
              payload: { year: now.getFullYear(), month: now.getMonth() },
            });
          }}
          aria-label="Jump to current month"
          className="px-2 py-1 mr-0.5 rounded-lg text-[11px] font-bold text-primary dark:text-primary-light hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
        >
          Today
        </button>
      )}
    </div>
  );
}
