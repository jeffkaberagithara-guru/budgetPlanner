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
  Other: "bg-gray-100 text-gray-700",
};

function TxRow({ tx }: { tx: Transaction }) {
  const { state, dispatch } = useBudget();

  function handleDelete() {
    const key = monthKey(state.currentYear, state.currentMonth);
    dispatch({ type: "DELETE_TRANSACTION", payload: { key, id: tx.id } });
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{tx.name}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[tx.category] ?? "bg-gray-100 text-gray-700"}`}
        >
          {tx.category}
        </span>
      </div>
      <p
        className={`text-sm font-bold shrink-0 ${tx.type === "income" ? "text-emerald-600" : "text-rose-500"}`}
      >
        {tx.type === "income" ? "+" : "-"}
        {formatKES(tx.amount)}
      </p>
      <button
        onClick={handleDelete}
        aria-label="Delete transaction"
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={15} />
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
      <div className="text-center py-10 text-gray-400 text-sm">
        No transactions yet. Add your first one above!
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {sorted.map((tx) => (
        <TxRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}