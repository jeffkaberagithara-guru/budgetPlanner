import { useMemo } from "react";
import {
  X,
  TrendingDown,
  PiggyBank,
  CheckCircle,
  AlertTriangle,
  Bell,
  Zap,
  Landmark,
} from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getEffectiveLimit, getMonthData, monthKey } from "../utils/budget";
import { categoryAverageBefore } from "../utils/insights";
import { lowBalanceAccounts } from "../utils/accounts";
import { Category } from "../types";
import EmptyState from "./EmptyState";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: Props) {
  const { state } = useBudget();
  const fmt = useFormat();
  const { transactions, savingsGoal, budgetLimits } = getMonthData(state);

  const notifications = useMemo(() => {
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
    const sPct = inc > 0 ? Math.round((exp / inc) * 100) : 0;
    const gPct =
      savingsGoal > 0 ? Math.round((sav / savingsGoal) * 100) : 0;

    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        spending[t.category] = (spending[t.category] ?? 0) + t.amount;
      });

    const currentKey = monthKey(state.currentYear, state.currentMonth);
    const spikes = Object.entries(spending)
      .map(([cat, spent]) => {
        const avg = categoryAverageBefore(state, cat, currentKey, 3);
        return { cat, spent, avg };
      })
      .filter(
        ({ avg, spent }) =>
          avg !== null && avg >= 100 && spent > avg * 1.5,
      )
      .sort(
        (a, b) => (b.spent / (b.avg as number)) - (a.spent / (a.avg as number)),
      )
      .slice(0, 2);

    return [
    sPct > 90 && {
      icon: TrendingDown,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
      title: "High Spending Alert",
      msg: `You've used ${sPct}% of your income this month.`,
      time: "Just now",
    },
    sPct > 70 &&
      sPct <= 90 && {
        icon: TrendingDown,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        title: "Spending Warning",
        msg: `You're at ${sPct}% of income spent. Slow down!`,
        time: "Just now",
      },
    gPct >= 100 && {
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
      title: "Savings Goal Reached!",
      msg: `Amazing! You've hit your ${fmt(savingsGoal)} savings goal.`,
      time: "This month",
    },
    savingsGoal > 0 &&
      gPct < 100 &&
      gPct > 0 && {
        icon: PiggyBank,
        color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20",
        title: "Savings Progress",
        msg: `You're ${gPct}% towards your ${fmt(savingsGoal)} goal.`,
        time: "This month",
      },
    transactions.length === 0 && {
      icon: PiggyBank,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
      title: "Get Started",
      msg: "Add your first income or expense to start tracking.",
      time: "Welcome",
    },
    ...spikes.map(({ cat, spent, avg }) => ({
      icon: Zap,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
      title: `${cat} Spending Spike`,
      msg: `${fmt(spent)} this month vs a 3-month average of ${fmt(avg as number)}.`,
      time: "This month",
    })),
    ...Object.entries(spending).map(([cat, spent]) => {
      const limit = budgetLimits.find((l) => l.category === cat);
      if (!limit) return false;
      const effective =
        getEffectiveLimit(
          state,
          monthKey(state.currentYear, state.currentMonth),
          cat as Category,
        ) ?? limit.limit;
      const pct = Math.round((spent / effective) * 100);
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
            ? `You've gone over your ${fmt(effective)} ${cat} budget.`
            : `You've used ${pct}% of your ${fmt(effective)} ${cat} budget.`,
        time: "This month",
      };
    }),
    ...lowBalanceAccounts(state).map(({ account, balance }) => ({
      icon: Landmark,
      color:
        balance < 0
          ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
          : "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
      title: balance < 0 ? `${account.name} Overdrawn` : `${account.name} Running Low`,
      msg:
        balance < 0
          ? `Balance is ${fmt(balance)} — below zero.`
          : `Balance is ${fmt(balance)}, at or under your ${fmt(account.lowBalanceThreshold as number)} alert line.`,
      time: "All time",
    })),
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    color: string;
    title: string;
    msg: string;
    time: string;
  }>;
  }, [state, transactions, savingsGoal, budgetLimits, fmt]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-16 right-4 z-50 w-80 bg-white dark:bg-surface-dark rounded-card shadow-elevated border border-gray-100 dark:border-gray-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
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

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState
              compact
              icon={Bell}
              title="All clear!"
              description="No alerts right now."
            />
          ) : (
            notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className={`p-2 rounded-icon shrink-0 ${n.color}`}>
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
