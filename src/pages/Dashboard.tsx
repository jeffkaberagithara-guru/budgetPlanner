import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  Lightbulb,
} from "lucide-react";
import MonthNav from "../components/MonthNav";
import MetricCard from "../components/MetricCard";
import SpendingBar from "../components/SpendingBar";
import AddTransactionModal from "../components/AddTransactionModal";
import TransactionList from "../components/TransactionList";
import CategoryChart from "../components/CategoryChart";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import { useBudget, getMonthData } from "../context/BudgetContext";
import { formatKES } from "../utils/format";
import { TransactionType } from "../types";

export default function Dashboard() {
  const { state } = useBudget();
  const { transactions, savingsGoal } = getMonthData(state);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saved = balance > 0 ? balance : 0;
  const goalPct =
    savingsGoal > 0
      ? Math.min(100, Math.round((saved / savingsGoal) * 100))
      : 0;
  const spendingPct =
    income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;

  function openModal(type: TransactionType) {
    setModalType(type);
    setModalOpen(true);
  }

  const insight =
    spendingPct > 90
      ? {
          msg: "You've used over 90% of your income — review your expenses!",
          color:
            "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400",
        }
      : spendingPct > 70
        ? {
            msg: `You're at ${spendingPct}% spending. Keep an eye on it.`,
            color:
              "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
          }
        : balance > 0
          ? {
              msg: `Great job! You're saving ${formatKES(balance)} this month. 🎉`,
              color:
                "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
            }
          : null;

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Your financial overview at a glance
          </p>
        </div>
        <MonthNav />
      </div>

      {/* Insight Banner */}
      {insight && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border mb-5 ${insight.color}`}
        >
          <Lightbulb size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{insight.msg}</p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        <MetricCard
          label="Total Income"
          value={formatKES(income)}
          icon={TrendingUp}
          color="green"
          sub="This month"
        />
        <MetricCard
          label="Total Expenses"
          value={formatKES(expense)}
          icon={TrendingDown}
          color="red"
          sub="This month"
        />
        <MetricCard
          label="Balance"
          value={formatKES(balance)}
          icon={Wallet}
          color={balance >= 0 ? "blue" : "red"}
          sub="Income minus expenses"
        />
        <MetricCard
          label="Savings Goal"
          value={`${goalPct}%`}
          icon={PiggyBank}
          color="violet"
          sub={savingsGoal > 0 ? `of ${formatKES(savingsGoal)}` : "No goal set"}
        />
      </div>

      {/* Spending Bar */}
      <div className="mb-5">
        <SpendingBar income={income} expense={expense} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h2>
          <CategoryChart />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            6-Month Comparison
          </h2>
          <MonthlyComparisonChart />
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-5 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-gray-400">
              {transactions.length} this month
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal("income")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition"
            >
              <Plus size={13} /> Income
            </button>
            <button
              onClick={() => openModal("expense")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition"
            >
              <Plus size={13} /> Expense
            </button>
          </div>
        </div>
        <TransactionList />
      </div>

      <AddTransactionModal
        open={modalOpen}
        defaultType={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
