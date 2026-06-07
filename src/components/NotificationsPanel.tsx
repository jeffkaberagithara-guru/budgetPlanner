import {
  X,
  TrendingDown,
  PiggyBank,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useBudget, getMonthData } from "../context/BudgetContext";
import { formatKES } from "../utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: Props) {
  const { state } = useBudget();
  const { transactions, savingsGoal, budgetLimits } = getMonthData(state);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saved = balance > 0 ? balance : 0;
  const spendingPct = income > 0 ? Math.round((expense / income) * 100) : 0;
  const savingsPct =
    savingsGoal > 0 ? Math.round((saved / savingsGoal) * 100) : 0;

  const spending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    });

  const notifications = [
    spendingPct > 90 && {
      icon: TrendingDown,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
      title: "High Spending Alert",
      msg: `You've used ${spendingPct}% of your income this month.`,
      time: "Just now",
    },
    spendingPct > 70 &&
      spendingPct <= 90 && {
        icon: TrendingDown,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        title: "Spending Warning",
        msg: `You're at ${spendingPct}% of income spent. Slow down!`,
        time: "Just now",
      },
    savingsPct >= 100 && {
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
      title: "Savings Goal Reached! 🎉",
      msg: `Amazing! You've hit your ${formatKES(savingsGoal)} savings goal.`,
      time: "This month",
    },
    savingsGoal > 0 &&
      savingsPct < 100 &&
      savingsPct > 0 && {
        icon: PiggyBank,
        color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
        title: "Savings Progress",
        msg: `You're ${savingsPct}% towards your ${formatKES(savingsGoal)} goal.`,
        time: "This month",
      },
    transactions.length === 0 && {
      icon: PiggyBank,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
      title: "Get Started",
      msg: "Add your first income or expense to start tracking.",
      time: "Welcome",
    },
    ...Object.entries(spending).map(([cat, spent]) => {
      const limit = budgetLimits.find((l) => l.category === cat);
      if (!limit) return false;
      const pct = Math.round((spent / limit.limit) * 100);
      if (pct < 80) return false;
      return {
        icon: AlertTriangle,
        color:
          pct >= 100
            ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
            : "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        title: pct >= 100 ? `${cat} Budget Exceeded!` : `${cat} Budget Warning`,
        msg:
          pct >= 100
            ? `You've gone over your ${formatKES(limit.limit)} ${cat} budget.`
            : `You've used ${pct}% of your ${formatKES(limit.limit)} ${cat} budget.`,
        time: "This month",
      };
    }),
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    color: string;
    title: string;
    msg: string;
    time: string;
  }>;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-16 right-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-xs text-gray-400">
              {notifications.length} alert
              {notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <span className="text-3xl mb-2">🔔</span>
              <p className="text-sm font-semibold text-gray-400">All clear!</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                No alerts right now.
              </p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${n.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {n.msg}
                    </p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                      {n.time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}