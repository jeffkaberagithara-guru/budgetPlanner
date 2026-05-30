import { useState } from "react";
import { X } from "lucide-react";
import { useBudget, monthKey } from "../context/BudgetContext";
import { Category, TransactionType } from "../types";

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

interface Props {
  open: boolean;
  defaultType: TransactionType;
  onClose: () => void;
}

export default function AddTransactionModal({
  open,
  defaultType,
  onClose,
}: Props) {
  const { state, dispatch } = useBudget();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Salary");

  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategory(t === "income" ? "Salary" : "Housing");
  }

  function handleSave() {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
    const date = `${monthKey(state.currentYear, state.currentMonth)}-01`;
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date,
      },
    });
    setName("");
    setAmount("");
    setCategory(type === "income" ? "Salary" : "Housing");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-2xl rounded-t-3xl shadow-xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle bar — mobile */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => handleTypeChange("income")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              type === "income"
                ? "bg-emerald-500 text-white shadow"
                : "text-gray-500"
            }`}
          >
            💰 Income
          </button>
          <button
            onClick={() => handleTypeChange("expense")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              type === "expense"
                ? "bg-rose-500 text-white shadow"
                : "text-gray-500"
            }`}
          >
            💸 Expense
          </button>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Description
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Rent, Groceries..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Amount (KES)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={0}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                  category === c
                    ? type === "income"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-rose-50 border-rose-300 text-rose-700"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            Save Transaction
          </button>
        </div>
      </div>
    </div>
  );
}