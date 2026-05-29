import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useBudget, monthKey } from "../context/BudgetContext";

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
    <div className="flex items-center gap-3">
      <button
        onClick={() => change(-1)}
        aria-label="Previous month"
        className="p-1.5 rounded-lg hover:bg-gray-100 transition"
      >
        <ChevronLeft size={18} className="text-gray-500" />
      </button>
      <span className="text-sm font-semibold text-gray-700 min-w-32 text-center">
        {format(date, "MMMM yyyy")}
      </span>
      <button
        onClick={() => change(1)}
        disabled={isCurrentMonth}
        aria-label="Next month"
        className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-30"
      >
        <ChevronRight size={18} className="text-gray-500" />
      </button>
    </div>
  );
}