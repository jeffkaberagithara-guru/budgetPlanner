import { useMemo } from "react";
import { Player } from "@remotion/player";
import { Printer } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthData } from "../utils/budget";
import { format } from "date-fns";
import { printMonthlyReport } from "../utils/printReport";
import { useToast } from "../hooks/useToast";
import MonthNav from "../components/MonthNav";
import CategoryChart from "../components/CategoryChart";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import BudgetVsActual from "../components/BudgetVsActual";
import PeriodComparison from "../components/PeriodComparison";
import TrendChart from "../components/TrendChart";
import RecurringCostAudit from "../components/RecurringCostAudit";
import CashFlowForecast from "../components/CashFlowForecast";
import YearInReview from "../components/YearInReview";
import CustomRangeReport from "../components/CustomRangeReport";
import Card from "../components/Card";
import MonthlySummaryComposition from "../remotion/MonthlySummaryComposition";

export default function Reports() {
  const { state } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const { transactions, savingsGoal } = getMonthData(state);

  const { income, expense, balance, saved, topCategory, topAmount } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const putAway = transactions
      .filter((t) => t.type === "savings")
      .reduce((s, t) => s + t.amount, 0);
    const bal = inc - exp - putAway;
    const sav = bal > 0 ? bal : 0;

    const catMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
      });
    const topEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      income: inc,
      expense: exp,
      balance: bal,
      saved: sav,
      topCategory: topEntry?.[0] ?? "",
      topAmount: topEntry?.[1] ?? 0,
    };
  }, [transactions]);

  const monthLabel = format(
    new Date(state.currentYear, state.currentMonth, 1),
    "MMMM yyyy",
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Visual breakdown of your finances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const ok = printMonthlyReport(
                state,
                state.currentYear,
                state.currentMonth,
              );
              if (!ok) {
                push({
                  message: "Allow pop-ups to print the report",
                  tone: "error",
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800/60 text-gray-500 dark:text-gray-400 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Printer size={13} /> Print / PDF
          </button>
          <MonthNav />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Income",
            value: fmt(income),
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
          {
            label: "Expenses",
            value: fmt(expense),
            color: "text-rose-500 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
          },
          {
            label: "Balance",
            value: fmt(balance),
            color:
              balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-rose-500 dark:text-rose-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Top Category",
            value: topCategory || "\u2014",
            color: "text-primary dark:text-primary-light",
            bg: "bg-teal-50 dark:bg-teal-900/20",
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-card p-4`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p className={`text-lg font-black truncate ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <BudgetVsActual />
        </Card>
        <Card>
          <PeriodComparison />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h2>
          <CategoryChart />
        </Card>
        <Card>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            6-Month Comparison
          </h2>
          <MonthlyComparisonChart />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <TrendChart />
        </Card>
        <Card>
          <RecurringCostAudit />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <CashFlowForecast />
        </Card>
        <Card>
          <YearInReview />
        </Card>
      </div>

      <Card className="mb-5">
        <CustomRangeReport />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Monthly Summary Video
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Animated summary of {monthLabel} — hit play!
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
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
              currency: state.currency,
            }}
            durationInFrames={150}
            compositionWidth={640}
            compositionHeight={380}
            fps={30}
            style={{
              width: "100%",
              maxWidth: 640,
              borderRadius: 16,
              overflow: "hidden",
            }}
            controls
            loop
          />
        </div>
      </Card>
    </div>
  );
}
