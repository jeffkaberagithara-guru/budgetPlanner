import { useState, useMemo } from "react";
import { PiggyBank, Target, TrendingUp } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthData, monthKey } from "../utils/budget";
import { useToast } from "../hooks/useToast";
import MonthNav from "../components/MonthNav";
import Card from "../components/Card";
import GoalsManager from "../components/GoalsManager";

export default function Savings() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const { transactions, savingsGoal } = getMonthData(state);
  const [goalInput, setGoalInput] = useState(
    savingsGoal > 0 ? String(savingsGoal) : "",
  );

  const { income, expense, putAway, balance, savedBalance, pct, remaining, ringOffset, ringColor } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const contrib = transactions
      .filter((t) => t.type === "savings")
      .reduce((s, t) => s + t.amount, 0);
    const bal = inc - exp - contrib;
    const sav = bal > 0 ? bal : 0;
    const p =
      savingsGoal > 0
        ? Math.min(100, Math.round((sav / savingsGoal) * 100))
        : 0;
    const rem = savingsGoal > sav ? savingsGoal - sav : 0;
    const offset = 283 - (283 * p) / 100;
    const color =
      p >= 100
        ? "#059669"
        : p >= 60
          ? "#0d9488"
          : p >= 30
            ? "#d97706"
            : "#e11d48";
    return { income: inc, expense: exp, putAway: contrib, balance: bal, savedBalance: sav, pct: p, remaining: rem, ringOffset: offset, ringColor: color };
  }, [transactions, savingsGoal]);

  function handleSave() {
    const goal = parseFloat(goalInput);
    if (!goal || goal <= 0) {
      push({
        message: "Enter an amount greater than zero",
        tone: "error",
      });
      return;
    }
    const key = monthKey(state.currentYear, state.currentMonth);
    dispatch({ type: "SET_SAVINGS_GOAL", payload: { key, goal } });
    push({
      message: savingsGoal > 0 ? "Savings goal updated" : "Savings goal set",
      tone: "success",
    });
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Savings
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Monthly target and long-term goals
          </p>
        </div>
        <MonthNav />
      </div>

      <GoalsManager />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="flex flex-col items-center justify-center !p-8">
          <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
                className="dark:stroke-gray-800"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={ringColor}
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
              <span className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                of goal
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                Saved
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {fmt(savedBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                Goal
              </p>
              <p className="text-sm font-bold text-primary dark:text-primary-light">
                {savingsGoal > 0 ? fmt(savingsGoal) : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                Remaining
              </p>
              <p className="text-sm font-bold text-rose-500 dark:text-rose-400">
                {savingsGoal > 0 ? fmt(remaining) : "\u2014"}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-primary dark:text-primary-light" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Set Monthly Goal
              </h2>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
              />
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-button bg-primary hover:bg-primary-dark text-white text-sm font-bold transition"
              >
                Save
              </button>
            </div>
            {pct >= 100 && (
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Congratulations! You've hit your savings goal!
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp
                size={18}
                className="text-emerald-500 dark:text-emerald-400"
              />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                This Month
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Total Income",
                  value: fmt(income),
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Total Expenses",
                  value: fmt(expense),
                  color: "text-rose-500 dark:text-rose-400",
                },
                {
                  label: "Put Toward Goals",
                  value: fmt(putAway),
                  color: "text-primary dark:text-primary-light",
                },
                {
                  label: "Net Savings",
                  value: fmt(balance),
                  color:
                    balance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500 dark:text-rose-400",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </span>
                  <span className={`text-sm font-black ${color}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-card border border-teal-100 dark:border-teal-800/40 p-6">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank
                size={18}
                className="text-primary dark:text-primary-light"
              />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Saving Tips
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#x2022;</span>Aim to save
                at least 20% of your income each month
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#x2022;</span>Review your
                Entertainment & Shopping spend first
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#x2022;</span>Set your
                goal before the month starts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#x2022;</span>Track every
                expense — small ones add up fast
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
