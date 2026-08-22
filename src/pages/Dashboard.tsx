import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  Lightbulb,
  CalendarDays,
  FlaskConical,
  Landmark,
} from "lucide-react";
import MonthNav from "../components/MonthNav";
import MetricCard from "../components/MetricCard";
import SpendingBar from "../components/SpendingBar";
import TransactionList from "../components/TransactionList";
import CategoryChart from "../components/CategoryChart";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { useBudget, useFormat } from "../hooks/useBudget";
import {
  getMonthData,
  getMonthTotals,
  monthKey,
  previousKey,
} from "../utils/budget";
import { useUI } from "../hooks/useUI";
import { useToast } from "../hooks/useToast";
import { disableDemo, enableDemo, isDemoActive } from "../utils/demo";
import { netWorth } from "../utils/accounts";
import { typeTotals } from "../utils/insights";
import { format } from "date-fns";

export default function Dashboard() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { openQuickAdd } = useUI();
  const { push } = useToast();
  const demoActive = isDemoActive();
  const { transactions, savingsGoal } = getMonthData(state);

  const { income, expense, balance, goalPct, spendingPct } = useMemo(() => {
    const { income: inc, expense: exp, saved: putAway } = typeTotals(transactions);
    const bal = inc - exp - putAway;
    const sav = bal > 0 ? bal : 0;
    const gPct =
      savingsGoal > 0
        ? Math.min(100, Math.round((sav / savingsGoal) * 100))
        : 0;
    const sPct =
      inc > 0 ? Math.min(100, Math.round((exp / inc) * 100)) : 0;
    return { income: inc, expense: exp, balance: bal, goalPct: gPct, spendingPct: sPct };
  }, [transactions, savingsGoal]);

  function toggleDemo() {
    if (demoActive) {
      disableDemo(dispatch);
      push({ message: "Sample data removed — your own data is back", tone: "info" });
    } else {
      enableDemo(dispatch);
      push({ message: "Sample data loaded — explore freely, exit anytime", tone: "success" });
    }
  }

  const prevLabel = useMemo(() => {
    const key = monthKey(state.currentYear, state.currentMonth);
    const [py, pm] = previousKey(key).split("-").map(Number);
    return format(new Date(py, pm - 1, 1), "MMMM");
  }, [state.currentYear, state.currentMonth]);

  const { incomeDelta, expenseDelta } = useMemo(() => {
    const key = monthKey(state.currentYear, state.currentMonth);
    const prev = getMonthTotals(state.data[previousKey(key)]);
    const pct = (cur: number, before: number) =>
      before > 0 ? Math.round(((cur - before) / before) * 100) : null;
    return {
      incomeDelta: pct(income, prev.income),
      expenseDelta: pct(expense, prev.expense),
    };
  }, [state.data, state.currentYear, state.currentMonth, income, expense]);

  const alertsOn = state.settings.spendingAlerts ?? true;
  const insight =
    alertsOn && spendingPct > 90
      ? {
          msg: "You've used over 90% of your income — review your expenses!",
          color:
            "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400",
        }
      : alertsOn && spendingPct > 70
        ? {
            msg: `You're at ${spendingPct}% spending. Keep an eye on it.`,
            color:
              "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
          }
        : balance > 0
          ? {
              msg: `Great job! You're saving ${fmt(balance)} this month.`,
              color:
                "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
            }
          : null;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Your financial overview at a glance
          </p>
        </div>
        <MonthNav />
      </div>

      {insight && (
        <div
          className={`flex items-start gap-3 p-4 rounded-card border mb-5 ${insight.color}`}
        >
          <Lightbulb size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{insight.msg}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        <MetricCard
          label="Total Income"
          value={fmt(income)}
          icon={TrendingUp}
          color="green"
          sub={
            incomeDelta === null
              ? "This month"
              : `${incomeDelta >= 0 ? "+" : ""}${incomeDelta}% vs ${prevLabel}`
          }
        />
        <MetricCard
          label="Total Expenses"
          value={fmt(expense)}
          icon={TrendingDown}
          color="red"
          sub={
            expenseDelta === null
              ? "This month"
              : `${expenseDelta >= 0 ? "+" : ""}${expenseDelta}% vs ${prevLabel}`
          }
        />
        <MetricCard
          label="Balance"
          value={fmt(balance)}
          icon={Wallet}
          color={balance >= 0 ? "blue" : "red"}
          sub="After expenses & savings"
        />
        <MetricCard
          label="Savings Goal"
          value={`${goalPct}%`}
          icon={PiggyBank}
          color="teal"
          sub={savingsGoal > 0 ? `of ${fmt(savingsGoal)}` : "No goal set"}
        />
      </div>

      {state.accounts.length > 1 && (
        <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-card bg-white dark:bg-surface-dark-alt border border-gray-100 dark:border-gray-800/60">
          <Landmark size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Across {state.accounts.length} accounts
          </span>
          <span
            className={`text-sm font-black ${
              netWorth(state) >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {netWorth(state) < 0 ? "-" : ""}
            {fmt(Math.abs(netWorth(state)))}
          </span>
          <Link
            to="/settings"
            className="ml-auto text-xs font-bold text-primary dark:text-primary-light hover:underline"
          >
            Manage
          </Link>
        </div>
      )}

      {transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title={`Nothing tracked in ${format(new Date(state.currentYear, state.currentMonth, 1), "MMMM")} yet`}
            description="Start by adding your income, then log expenses as they happen. Use the arrows above to browse other months."
          >
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => openQuickAdd("income")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition"
              >
                <Plus size={13} /> Add Income
              </button>
              <button
                onClick={() => openQuickAdd("expense")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition"
              >
                <Plus size={13} /> Add Expense
              </button>
              {!demoActive && (
                <button
                  onClick={toggleDemo}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-button border border-teal-300 dark:border-teal-700 text-primary dark:text-primary-light text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
                >
                  <FlaskConical size={13} /> Explore Sample Data
                </button>
              )}
            </div>
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="mb-5">
            <SpendingBar income={income} expense={expense} />
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

          <Card padded={false}>
            <div className="flex items-center justify-between mb-4 px-5 pt-5">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recent Transactions
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {transactions.length} this month
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openQuickAdd("income")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
                >
                  <Plus size={13} /> Income
                </button>
                <button
                  onClick={() => openQuickAdd("expense")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
                >
                  <Plus size={13} /> Expense
                </button>
              </div>
            </div>
            <div className="px-5 pb-5">
              <TransactionList />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
