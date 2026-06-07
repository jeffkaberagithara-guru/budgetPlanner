import { useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { Trash2 } from "lucide-react";
import { useBudget, getMonthData, monthKey } from "../context/BudgetContext";
import { useSearch } from "../context/SearchContext";
import { exportToCSV } from "../utils/export";
import AddTransactionModal from "../components/AddTransactionModal";
import MonthNav from "../components/MonthNav";
import RecurringManager from "../components/RecurringManager";
import BudgetLimits from "../components/BudgetLimits";
import { TransactionType, Transaction } from "../types";
import { formatKES } from "../utils/format";

const CAT_COLORS: Record<string, string> = {
  Salary:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  Freelance: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  Investment:
    "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  "Other Income":
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  Housing: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  Food: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  Transport:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Health: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  Entertainment:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Shopping:
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  Utilities: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Education: "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400",
  Other: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
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

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 group">
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${CAT_DOT[tx.category] ?? "bg-gray-400"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {tx.name}
          </p>
          {tx.recurring && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium shrink-0">
              🔄 recurring
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[tx.category] ?? ""}`}
          >
            {tx.category}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">
            {tx.date}
          </span>
        </div>
      </div>
      <p
        className={`text-sm font-black shrink-0 ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"}`}
      >
        {tx.type === "income" ? "+" : "-"}
        {formatKES(tx.amount)}
      </p>
      <button
        onClick={onDelete}
        aria-label="Delete"
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function Transactions() {
  const { state, dispatch } = useBudget();
  const { transactions } = getMonthData(state);
  const { query, setQuery } = useSearch();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const key = monthKey(state.currentYear, state.currentMonth);

  const filtered = [...transactions].reverse().filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  function openModal(type: TransactionType) {
    setModalType(type);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    dispatch({ type: "DELETE_TRANSACTION", payload: { key, id } });
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-gray-400">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} this month
          </p>
        </div>
        <MonthNav />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Income",
            value: formatKES(income),
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
          {
            label: "Expenses",
            value: formatKES(expense),
            color: "text-rose-500",
            bg: "bg-rose-50 dark:bg-rose-900/20",
          },
          {
            label: "Balance",
            value: formatKES(income - expense),
            color: income - expense >= 0 ? "text-blue-600" : "text-rose-500",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-2xl p-3 md:p-4 text-center`}
          >
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-sm md:text-base font-black truncate ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Mobile search */}
        <div className="flex sm:hidden items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 flex-1">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions..."
            className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none w-full"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => openModal("income")}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition"
          >
            <Plus size={13} /> Income
          </button>
          <button
            onClick={() => openModal("expense")}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition"
          >
            <Plus size={13} /> Expense
          </button>
          <button
            onClick={() => exportToCSV(transactions, key)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-5 transition-colors mb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
              <span className="text-2xl">{query ? "🔍" : "💸"}</span>
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {query ? `No results for "${query}"` : "No transactions yet"}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              {query
                ? "Try a different search term"
                : "Add your first income or expense above"}
            </p>
          </div>
        ) : (
          filtered.map((tx) => (
            <TxRow key={tx.id} tx={tx} onDelete={() => handleDelete(tx.id)} />
          ))
        )}
      </div>

      {/* Recurring + Budget Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <RecurringManager />
        <BudgetLimits />
      </div>

      <AddTransactionModal
        open={modalOpen}
        defaultType={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}