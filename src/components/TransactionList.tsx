import { Trash2 } from "lucide-react";
import { useBudget, getMonthData, monthKey } from "../context/BudgetContext";
import { Transaction } from "../types";
import { formatKES } from "../utils/format";

const CAT_COLORS: Record<string, string> = {
  Salary: "bg-emerald-100 text-emerald-700",
  Freelance: "bg-teal-100 text-teal-700",
  Investment: "bg-cyan-100 text-cyan-700",
  "Other Income": "bg-green-100 text-green-700",
  Housing: "bg-rose-100 text-rose-700",
  Food: "bg-orange-100 text-orange-700",
  Transport: "bg-amber-100 text-amber-700",
  Health: "bg-pink-100 text-pink-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Shopping: "bg-indigo-100 text-indigo-700",
  Utilities: "bg-blue-100 text-blue-700",
  Education: "bg-lime-100 text-lime-700",
  Other: "bg-gray-100 text-gray-600",
};

const CAT_DOT: Record<string, string> = {
  Salary: "bg-emerald-500",
  Freelance: "bg-teal-500",
  Investment: "bg-cyan-500",
  "Other Income": "bg-green-500",
  Housing: "bg-rose-500",
  Food: "bg-orange-500",
  Transport: "bg-amber-500",
  Health: "bg-pink-500",
  Entertainment: "bg-purple-500",
  Shopping: "bg-indigo-500",
  Utilities: "bg-blue-500",
  Education: "bg-lime-500",
  Other: "bg-gray-400",
};

function TxRow({ tx }: { tx: Transaction }) {
  const { state, dispatch } = useBudget();

  function handleDelete() {
    const key = monthKey(state.currentYear, state.currentMonth);
    dispatch({ type: "DELETE_TRANSACTION", payload: { key, id: tx.id } });
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${CAT_DOT[tx.category] ?? "bg-gray-400"}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {tx.name}
        </p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[tx.category] ?? "bg-gray-100 text-gray-600"}`}
        >
          {tx.category}
        </span>
      </div>
      <p
        className={`text-sm font-black shrink-0 ${tx.type === "income" ? "text-emerald-600" : "text-rose-500"}`}
      >
        {tx.type === "income" ? "+" : "-"}
        {formatKES(tx.amount)}
      </p>
      <button
        onClick={handleDelete}
        aria-label="Delete transaction"
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function TransactionList() {
  const { state } = useBudget();
  const { transactions } = getMonthData(state);
  const sorted = [...transactions].reverse();

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
          <span className="text-2xl">💸</span>
        </div>
        <p className="text-sm font-semibold text-gray-400">
          No transactions yet
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Add your first income or expense above
        </p>
      </div>
    );
  }

  return (
    <div>
      {sorted.map((tx) => (
        <TxRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}