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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => handleTypeChange("income")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === "income"
                ? "bg-emerald-500 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Income
          </button>
          <button
            onClick={() => handleTypeChange("expense")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === "expense"
                ? "bg-rose-500 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Expense
          </button>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Rent, Groceries..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount (KES)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={0}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition bg-white"
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition ${
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}