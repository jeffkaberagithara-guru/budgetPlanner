import { useState } from "react";
import { Plus, Trash2, RefreshCw, Repeat, Pencil } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { monthKey } from "../utils/budget";
import { useToast } from "../hooks/useToast";
import { Category, TransactionType, RecurringFrequency, Transaction } from "../types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, SAVINGS_CATEGORY } from "../utils/categories";
import EmptyState from "./EmptyState";

export default function RecurringManager() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<Category>("Housing");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");

  const key = monthKey(state.currentYear, state.currentMonth);

  function startEdit(t: Transaction) {
    setEditId(t.id);
    setName(t.name);
    setAmount(String(t.amount));
    setType(t.type);
    setCategory(t.category as Category);
    setFrequency(t.frequency ?? "monthly");
    setShowForm(true);
  }

  function resetForm() {
    setEditId(null);
    setName("");
    setAmount("");
    setType("expense");
    setCategory("Housing");
    setFrequency("monthly");
  }

  function handleSave() {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
    if (editId) {
      dispatch({
        type: "UPDATE_RECURRING",
        payload: {
          id: editId,
          patch: {
            name: name.trim(),
            amount: parseFloat(amount),
            type,
            category,
            frequency,
          },
        },
      });
      push({ message: `Template "${name.trim()}" updated`, tone: "success" });
      setShowForm(false);
      resetForm();
      return;
    }
    dispatch({
      type: "ADD_RECURRING",
      payload: {
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date: `${key}-01`,
        recurring: true,
        frequency,
      },
    });
    push({ message: `Recurring template "${name.trim()}" saved`, tone: "success" });
    setShowForm(false);
    resetForm();
  }

  function handleRemove(t: Transaction) {
    dispatch({ type: "REMOVE_RECURRING", payload: t.id });
    push({
      message: `Removed template "${t.name}"`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () => dispatch({ type: "ADD_RECURRING", payload: { ...t } }),
      },
    });
  }

  function handleApply() {
    dispatch({ type: "APPLY_RECURRING", payload: { key } });
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-card shadow-card border border-gray-100 dark:border-gray-800/60 p-5 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-icon bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
            <Repeat size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Recurring Transactions
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {state.recurringTemplates.length} template
              {state.recurringTemplates.length !== 1 ? "s" : ""}
              {state.settings.autoApplyRecurring && " · auto-posted monthly"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {state.recurringTemplates.length > 0 && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
            >
              <RefreshCw size={12} /> Apply to Month
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {showForm && (
        <form
          noValidate
          className="bg-gray-50 dark:bg-gray-800/60 rounded-card p-4 mb-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
            {(
              [
                ["income", "bg-emerald-500"],
                ["expense", "bg-rose-500"],
                ["savings", "bg-primary"],
              ] as const
            ).map(([t, activeBg]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory(
                    t === "income" ? "Salary" : t === "savings" ? SAVINGS_CATEGORY : "Housing",
                  );
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  type === t
                    ? `${activeBg} text-white`
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name e.g. Rent, Salary..."
            className="w-full px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
          />

          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
            >
              {(
                type === "income"
                  ? INCOME_CATEGORIES
                  : type === "savings"
                    ? [SAVINGS_CATEGORY]
                    : EXPENSE_CATEGORIES
              ).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>

            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as RecurringFrequency)
              }
              className="px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex-1 py-2 rounded-button border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2 rounded-button bg-primary hover:bg-primary-dark text-white text-sm font-bold transition disabled:opacity-40"
            >
              {editId ? "Save Changes" : "Save Template"}
            </button>
          </div>
          {editId && (
            <p className="text-xs text-teal-600 dark:text-teal-400">
              Editing a template — future auto-posted months will use these details.
            </p>
          )}
        </form>
      )}

      {state.recurringTemplates.length === 0 ? (
        <EmptyState
          compact
          icon={Repeat}
          title="No recurring transactions"
          description="Add templates for rent, salary, subscriptions etc."
        />
      ) : (
        <div className="space-y-2">
          {state.recurringTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  t.type === "income"
                    ? "bg-emerald-500"
                    : t.type === "savings"
                      ? "bg-teal-500"
                      : "bg-rose-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {t.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t.category} · {t.frequency}
                </p>
              </div>
              <p
                className={`text-sm font-black shrink-0 ${
                  t.type === "income"
                    ? "text-emerald-500"
                    : t.type === "savings"
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-rose-500"
                }`}
              >
                {t.type === "expense" ? "-" : "+"}
                {fmt(t.amount)}
              </p>
              <button
                onClick={() => startEdit(t)}
                aria-label={`Edit ${t.name}`}
                className="p-1.5 rounded-lg text-gray-300 hover:text-primary hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleRemove(t)}
                aria-label="Remove"
                className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
