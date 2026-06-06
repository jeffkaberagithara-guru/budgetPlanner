import { useState } from "react";
import { PiggyBank, Target, TrendingUp } from "lucide-react";
import { useBudget, getMonthData, monthKey } from "../context/BudgetContext";
import { formatKES } from "../utils/format";
import MonthNav from "../components/MonthNav";

export default function Savings() {
  const { state, dispatch } = useBudget();
  const { transactions, savingsGoal } = getMonthData(state);
  const [goalInput, setGoalInput] = useState(
    savingsGoal > 0 ? String(savingsGoal) : "",
  );

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saved = balance > 0 ? balance : 0;
  const pct =
    savingsGoal > 0
      ? Math.min(100, Math.round((saved / savingsGoal) * 100))
      : 0;
  const remaining = savingsGoal > saved ? savingsGoal - saved : 0;
  const ringOffset = 283 - (283 * pct) / 100;
  const color =
    pct >= 100
      ? "#10b981"
      : pct >= 60
        ? "#a78bfa"
        : pct >= 30
          ? "#fbbf24"
          : "#f43f5e";

  function handleSave() {
    const goal = parseFloat(goalInput);
    if (!goal || goal <= 0) return;
    const key = monthKey(state.currentYear, state.currentMonth);
    dispatch({ type: "SET_SAVINGS_GOAL", payload: { key, goal } });
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Savings Goal
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Set and track your monthly savings target
          </p>
        </div>
        <MonthNav />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Ring */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center justify-center transition-colors">
          <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={ringOffset}
                style={{
                  transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900 dark:text-white">
                {pct}%
              </span>
              <span className="text-sm text-gray-400 mt-1">of goal</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">Saved</p>
              <p className="text-sm font-bold text-emerald-600">
                {formatKES(saved)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Goal</p>
              <p className="text-sm font-bold text-violet-600">
                {savingsGoal > 0 ? formatKES(savingsGoal) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Remaining</p>
              <p className="text-sm font-bold text-rose-500">
                {savingsGoal > 0 ? formatKES(remaining) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Set Goal */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-violet-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Set Monthly Goal
              </h2>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Enter amount in KES"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold transition"
              >
                Save
              </button>
            </div>
            {pct >= 100 && (
              <p className="mt-3 text-sm text-emerald-600 font-medium">
                🎉 Congratulations! You've hit your savings goal!
              </p>
            )}
          </div>

          {/* This month breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                This Month
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Total Income",
                  value: formatKES(income),
                  color: "text-emerald-600",
                },
                {
                  label: "Total Expenses",
                  value: formatKES(expense),
                  color: "text-rose-500",
                },
                {
                  label: "Net Savings",
                  value: formatKES(balance),
                  color: balance >= 0 ? "text-emerald-600" : "text-rose-500",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </span>
                  <span className={`text-sm font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-linear-to-br from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl border border-violet-100 dark:border-violet-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank size={18} className="text-violet-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Saving Tips
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>Aim to save at
                least 20% of your income each month
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>Review your
                Entertainment & Shopping spend first
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>Set your goal
                before the month starts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>Track every
                expense — small ones add up fast
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
