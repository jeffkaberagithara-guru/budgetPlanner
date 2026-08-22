import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Target,
  CalendarDays,
  Repeat,
  Sparkles,
} from "lucide-react";
import { AllocationMode, Goal } from "../types";
import { useBudget, useFormat } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import Card from "./Card";
import EmptyState from "./EmptyState";
import { monthKey } from "../utils/budget";
import { defaultTransactionDate } from "../utils/date";
import {
  crossedMilestone,
  goalSaved,
  goalSavedThisMonth,
  monthsUntil,
  plannedAllocation,
  requiredPerMonth,
} from "../utils/goals";

const EMPTY_FORM = {
  name: "",
  targetAmount: "",
  targetDate: "",
  allocationMode: "off" as AllocationMode,
  allocationValue: "",
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-teal-500" : "bg-primary"
        }`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export default function GoalsManager() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contributions, setContributions] = useState<Record<string, string>>({});

  const key = monthKey(state.currentYear, state.currentMonth);
  const monthlyIncome = useMemo(
    () =>
      (state.data[key]?.transactions ?? [])
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [state.data, key],
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      targetDate: goal.targetDate ?? "",
      allocationMode: goal.allocationMode,
      allocationValue:
        goal.allocationValue > 0 ? String(goal.allocationValue) : "",
    });
    setFormOpen(true);
  }

  function handleFormError(message: string) {
    push({ message, tone: "error" });
  }

  function handleSubmit() {
    const target = parseFloat(form.targetAmount);
    if (!form.name.trim()) return handleFormError("Give your goal a name");
    if (!target || target <= 0)
      return handleFormError("Target amount must be greater than zero");

    const base = {
      name: form.name.trim(),
      targetAmount: target,
      targetDate: form.targetDate || undefined,
      allocationMode: form.allocationMode,
      allocationValue:
        form.allocationMode === "off"
          ? 0
          : Math.max(0, parseFloat(form.allocationValue) || 0),
    };

    if (editingId) {
      dispatch({
        type: "UPDATE_GOAL",
        payload: { id: editingId, patch: base },
      });
      push({ message: `Updated "${base.name}"`, tone: "success" });
    } else {
      dispatch({
        type: "ADD_GOAL",
        payload: {
          ...base,
          id: crypto.randomUUID(),
          createdAt: key,
        },
      });
      push({ message: `Goal "${base.name}" created`, tone: "success" });
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(false);
  }

  function handleDelete(goal: Goal) {
    dispatch({ type: "DELETE_GOAL", payload: goal.id });
    push({
      message: `Deleted "${goal.name}"`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () => dispatch({ type: "ADD_GOAL", payload: { ...goal } }),
      },
    });
  }

  function contribute(goal: Goal) {
    const amount = parseFloat(contributions[goal.id] ?? "");
    if (!amount || amount <= 0) return;
    const before = goalSaved(state, goal.id);
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        id: crypto.randomUUID(),
        name: goal.name,
        amount,
        type: "savings",
        category: "Savings",
        date: defaultTransactionDate(state.currentYear, state.currentMonth),
        goalId: goal.id,
      },
    });
    setContributions((c) => ({ ...c, [goal.id]: "" }));
    const milestone = crossedMilestone(before, before + amount, goal.targetAmount);
    push({
      message: milestone
        ? `${milestone.label} — ${goal.name}: ${fmt(before + amount)} of ${fmt(goal.targetAmount)}`
        : `Added ${fmt(amount)} to ${goal.name}`,
      tone: milestone ? "success" : "info",
      icon: milestone ? <Sparkles size={14} /> : undefined,
    });
  }

  function fundAllPlanned() {
    const planned = state.goals
      .map((goal) => ({
        goal,
        want: plannedAllocation(goal, monthlyIncome),
        have: goalSavedThisMonth(state, key, goal.id),
        before: goalSaved(state, goal.id),
      }))
      .filter(({ goal, want, have }) =>
        want > 0 && have < want && goal.targetAmount - goalSaved(state, goal.id) > 0,
      )
      .map(({ goal, want, have, before }) => ({
        goal,
        amount: Math.min(want - have, goal.targetAmount - before),
      }));

    if (planned.length === 0) {
      push({ message: "All planned contributions are already funded", tone: "info" });
      return;
    }

    let total = 0;
    for (const { goal, amount } of planned) {
      total += amount;
      dispatch({
        type: "ADD_TRANSACTION",
        payload: {
          id: crypto.randomUUID(),
          name: goal.name,
          amount,
          type: "savings",
          category: "Savings",
          date: defaultTransactionDate(state.currentYear, state.currentMonth),
          goalId: goal.id,
        },
      });
    }
    push({
      message: `Funded ${planned.length} goal${planned.length !== 1 ? "s" : ""} · ${fmt(total)}`,
      tone: "success",
      icon: <Sparkles size={14} />,
    });
  }

  const plannedTotal = state.goals.reduce(
    (sum, g) => sum + plannedAllocation(g, monthlyIncome),
    0,
  );
  const hasAllocations = state.goals.some((g) => g.allocationMode !== "off");

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-icon bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light">
            <Target size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Savings Goals
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {state.goals.length === 0
                ? "Named goals with targets and dates"
                : `${state.goals.length} goal${state.goals.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => (formOpen && !editingId ? setFormOpen(false) : openAdd())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition"
        >
          {formOpen && !editingId ? <X size={12} /> : <Plus size={12} />}
          {formOpen && !editingId ? "Close" : "Add"}
        </button>
      </div>

      {formOpen && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-card p-4 mb-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {editingId ? "Edit Goal" : "New Goal"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Emergency fund, Laptop, Kenya trip"
              maxLength={60}
              className="sm:col-span-2 px-3 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
            />
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                Target amount
              </span>
              <input
                type="number"
                min={0}
                value={form.targetAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetAmount: e.target.value }))
                }
                placeholder="100000"
                className="w-full px-3 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                Target date (optional)
              </span>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400">
              Auto-set aside
            </span>
            {(
              [
                ["off", "Off"],
                ["fixed", "Fixed / mo"],
                ["percent", "% of income"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() =>
                  setForm((f) => ({ ...f, allocationMode: mode }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition border ${
                  form.allocationMode === mode
                    ? "bg-primary/10 dark:bg-primary/20 border-primary/40 text-primary dark:text-teal-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
            {form.allocationMode !== "off" && (
              <input
                type="number"
                min={0}
                value={form.allocationValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allocationValue: e.target.value }))
                }
                placeholder={
                  form.allocationMode === "fixed" ? "5000" : "10"
                }
                className="w-28 px-3 py-1.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2 rounded-button border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !(parseFloat(form.targetAmount) > 0)}
              className="px-5 py-2 rounded-button bg-primary hover:bg-primary-dark disabled:opacity-40 text-white text-xs font-bold transition"
            >
              {editingId ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      {state.goals.length === 0 ? (
        <EmptyState
          compact
          icon={Target}
          title="No goals yet"
          description="Create a goal for your emergency fund, a big purchase, or a trip — then chip away at it monthly."
        />
      ) : (
        <>
          {hasAllocations && (
            <div className="flex items-center justify-between gap-3 bg-teal-50/70 dark:bg-teal-900/20 rounded-card px-4 py-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Repeat size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  Planned this month{" "}
                  <span className="font-black">{fmt(plannedTotal)}</span>
                  {monthlyIncome > 0 && " · based on income"}
                </p>
              </div>
              <button
                onClick={fundAllPlanned}
                className="shrink-0 px-3 py-1.5 rounded-button bg-primary hover:bg-primary-dark text-white text-xs font-bold transition"
              >
                Fund all
              </button>
            </div>
          )}

          <div className="space-y-4">
            {state.goals.map((goal) => {
              const saved = goalSaved(state, goal.id);
              const pct =
                goal.targetAmount > 0
                  ? Math.floor((saved / goal.targetAmount) * 100)
                  : 0;
              const remaining = Math.max(0, goal.targetAmount - saved);
              const perMonth = requiredPerMonth(goal, saved);
              const months = monthsUntil(goal.targetDate);
              const planned = plannedAllocation(goal, monthlyIncome);

              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800/60 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {goal.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {fmt(saved)} of {fmt(goal.targetAmount)}
                        {remaining > 0 && (
                          <> · {fmt(remaining)} to go</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {pct >= 100 && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mr-1">
                          Done!
                        </span>
                      )}
                      <button
                        onClick={() => openEdit(goal)}
                        aria-label={`Edit ${goal.name}`}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 transition"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        aria-label={`Delete ${goal.name}`}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 mb-1">
                    <ProgressBar pct={pct} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-xs font-black text-primary dark:text-teal-300">
                      {pct}%
                    </span>
                    {perMonth !== null && remaining > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <CalendarDays size={11} />
                        {fmt(perMonth)}/mo
                        {months === 0 ? " (due!)" : ` for ${months} mo`}
                      </span>
                    )}
                    {planned > 0 && (
                      <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                        <Repeat size={11} />
                        auto {fmt(planned)}/mo
                      </span>
                    )}
                  </div>

                  {remaining > 0 && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="number"
                        min={0}
                        value={contributions[goal.id] ?? ""}
                        onChange={(e) =>
                          setContributions((c) => ({
                            ...c,
                            [goal.id]: e.target.value,
                          }))
                        }
                        placeholder="Contribute amount"
                        className="flex-1 min-w-0 px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
                      />
                      <button
                        onClick={() => contribute(goal)}
                        disabled={!(parseFloat(contributions[goal.id] ?? "") > 0)}
                        className="px-4 py-2 rounded-button bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition"
                      >
                        Contribute
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
