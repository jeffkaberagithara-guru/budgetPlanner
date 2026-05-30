import { Player } from "@remotion/player";
import { useBudget, getMonthData } from "../context/BudgetContext";
import { format } from "date-fns";
import MonthNav from "../components/MonthNav";
import CategoryChart from "../components/CategoryChart";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import MonthlySummaryComposition from "../remotion/MonthlySummaryComposition";
import { formatKES } from "../utils/format";

export default function Reports() {
  const { state } = useBudget();
  const { transactions, savingsGoal } = getMonthData(state);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const balance = income - expense;
  const saved = balance > 0 ? balance : 0;

  // Top expense category
  const catMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    });
  const topEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry?.[0] ?? "";
  const topAmount = topEntry?.[1] ?? 0;

  const monthLabel = format(
    new Date(state.currentYear, state.currentMonth, 1),
    "MMMM yyyy",
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visual breakdown of your finances
          </p>
        </div>
        <MonthNav />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Income",
            value: formatKES(income),
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Expenses",
            value: formatKES(expense),
            color: "text-rose-500",
            bg: "bg-rose-50",
          },
          {
            label: "Balance",
            value: formatKES(balance),
            color: balance >= 0 ? "text-blue-600" : "text-rose-500",
            bg: "bg-blue-50",
          },
          {
            label: "Top Category",
            value: topCategory || "—",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-black truncate ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Spending by Category
          </h2>
          <CategoryChart />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            6-Month Comparison
          </h2>
          <MonthlyComparisonChart />
        </div>
      </div>

      {/* Remotion Monthly Summary Video */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Monthly Summary Video
            </h2>
            <p className="text-sm text-gray-400">
              Animated summary of {monthLabel} — hit play!
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-600">
            Powered by Remotion
          </span>
        </div>
        <div className="flex justify-center">
          <Player
            component={MonthlySummaryComposition}
            inputProps={{
              month: monthLabel,
              income,
              expense,
              balance,
              topCategory,
              topAmount,
              savingsGoal,
              saved,
            }}
            durationInFrames={120}
            compositionWidth={640}
            compositionHeight={400}
            fps={30}
            style={{
              width: "100%",
              maxWidth: 640,
              borderRadius: 16,
              overflow: "hidden",
            }}
            controls
          />
        </div>
      </div>
    </div>
  );
}