import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
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

  function openModal(type: TransactionType) {
    setModalType(type);
    setModalOpen(true);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your income & spending
          </p>
        </div>
        <MonthNav />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="mb-6">
        <SpendingBar income={income} expense={expense} />
      </div>

      {/* Charts Row */}
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

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Transactions</h2>
          <div className="flex gap-2">
            <button
              onClick={() => openModal("income")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition"
            >
              <Plus size={15} /> Income
            </button>
            <button
              onClick={() => openModal("expense")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 text-sm font-semibold hover:bg-rose-100 transition"
            >
              <Plus size={15} /> Expense
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