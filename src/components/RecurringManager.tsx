import { useState } from "react";
import { Plus, Trash2, RefreshCw, Repeat } from "lucide-react";
import { useBudget, monthKey } from "../context/BudgetContext";
import { Category, TransactionType, RecurringFrequency } from "../types";
import { formatKES } from "../utils/format";

const INCOME_CATS: Category[] = [
  "Salary",
  "Freelance",
  "Investment",
  "Other Income",
];
const EXPENSE_CATS: Category[] = [
  "Housing",
  "Food",
  "Transport",
  "Health",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Education",
  "Other",
];

export default function RecurringManager() {
  const { state, dispatch } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<Category>("Housing");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");

  const key = monthKey(state.currentYear, state.currentMonth);

  function handleAdd() {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
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
    setName("");
    setAmount("");
    setShowForm(false);
  }

  function handleApply() {
    dispatch({ type: "APPLY_RECURRING", payload: { key } });
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600">
            <Repeat size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Recurring Transactions
            </h2>
            <p className="text-xs text-gray-400">
              {state.recurringTemplates.length} template
              {state.recurringTemplates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {state.recurringTemplates.length > 0 && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition"
            >
              <RefreshCw size={12} /> Apply to Month
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-100 transition"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
            {(["income", "expense"] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCategory(t === "income" ? "Salary" : "Housing");
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  type === t
                    ? t === "income"
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                    : "text-gray-500"
                }`}
              >
                {t === "income" ? "💰" : "💸"} {t}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name e.g. Rent, Salary..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 transition text-gray-800 dark:text-gray-100"
          />

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (KES)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 transition text-gray-800 dark:text-gray-100"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 transition text-gray-800 dark:text-gray-100"
            >
              {(type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as RecurringFrequency)
              }
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-400 transition text-gray-800 dark:text-gray-100"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold transition disabled:opacity-40"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {state.recurringTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">🔄</span>
          <p className="text-sm font-semibold text-gray-400">
            No recurring transactions
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Add templates for rent, salary, subscriptions etc.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.recurringTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${t.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {t.name}
                </p>
                <p className="text-xs text-gray-400">
                  {t.category} · {t.frequency}
                </p>
              </div>
              <p
                className={`text-sm font-black shrink-0 ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatKES(t.amount)}
              </p>
              <button
                onClick={() =>
                  dispatch({ type: "REMOVE_RECURRING", payload: t.id })
                }
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