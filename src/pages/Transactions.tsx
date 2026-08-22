import { useState, useMemo, useDeferredValue } from "react";
import {
  Download,
  FileUp,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthData, monthKey } from "../utils/budget";
import { useSearch } from "../hooks/useSearch";
import { useToast } from "../hooks/useToast";
import { useUI } from "../hooks/useUI";
import { exportToCSV } from "../utils/export";
import CsvImportModal from "../components/CsvImportModal";
import MonthNav from "../components/MonthNav";
import RecurringManager from "../components/RecurringManager";
import BudgetLimits from "../components/BudgetLimits";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import ShowMoreList from "../components/ShowMoreList";
import SwipeableRow from "../components/SwipeableRow";
import { Transaction } from "../types";
import { formatDate, daysInMonth } from "../utils/date";
import { PAYMENT_METHOD_META } from "../utils/payment-methods";
import { CATEGORY_DOT, CATEGORY_BADGE } from "../utils/categories";
import { accountName } from "../utils/accounts";
import { Landmark, ArrowRight } from "lucide-react";

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const fmt = useFormat();
  const { state } = useBudget();
  const { openEditTransaction } = useUI();
  return (
    <SwipeableRow
      onDelete={onDelete}
      label={`Delete ${tx.name}`}
      className="border-b border-gray-50 dark:border-gray-800/60 last:border-0"
    >
      <div className="flex items-center gap-3 py-3.5 group">
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_DOT[tx.category] ?? "bg-gray-400"}`}
      />
      <div className={`flex-1 min-w-0 ${tx.pending ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {tx.name}
          </p>
          {tx.recurring && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-medium shrink-0">
              recurring
            </span>
          )}
          {tx.pending && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium shrink-0">
              pending
            </span>
          )}
        </div>
        {tx.note && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {tx.note}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[tx.category] ?? ""}`}
          >
            {tx.category}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">
            {formatDate(tx.date, "EEE, MMM d")}
          </span>
          {tx.method && (
            <span
              className="flex items-center gap-0.5 text-xs text-gray-300 dark:text-gray-600"
              title={PAYMENT_METHOD_META[tx.method].label}
            >
              {(() => {
                const MethodIcon = PAYMENT_METHOD_META[tx.method].icon;
                return <MethodIcon size={11} />;
              })()}
              {PAYMENT_METHOD_META[tx.method].label}
            </span>
          )}
          {state.accounts.length > 1 && tx.type === "transfer" && tx.toAccountId && (
            <span className="flex items-center gap-0.5 text-xs text-gray-300 dark:text-gray-600">
              <Landmark size={11} />
              {accountName(state, tx.accountId)}
              <ArrowRight size={10} />
              {accountName(state, tx.toAccountId)}
            </span>
          )}
          {state.accounts.length > 1 && tx.type !== "transfer" && tx.accountId && (
            <span
              className="flex items-center gap-0.5 text-xs text-gray-300 dark:text-gray-600"
              title={accountName(state, tx.accountId)}
            >
              <Landmark size={11} />
              {accountName(state, tx.accountId)}
            </span>
          )}
        </div>
      </div>
      {tx.type === "transfer" ? (
        <p className="flex items-center gap-0.5 text-sm font-black shrink-0 text-blue-600 dark:text-blue-400">
          <ArrowRight size={12} />
          {fmt(tx.amount)}
        </p>
      ) : (
        <p
          className={`text-sm font-black shrink-0 ${
            tx.type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : tx.type === "savings"
                ? "text-primary dark:text-primary-light"
                : "text-rose-500 dark:text-rose-400"
          }`}
        >
          {tx.type === "expense" ? "-" : "+"}
          {fmt(tx.amount)}
        </p>
      )}
      <button
        onClick={() =>
          openEditTransaction(monthKey(state.currentYear, state.currentMonth), tx)
        }
        aria-label={`Edit ${tx.name}`}
        className="p-1.5 rounded-lg text-gray-300 hover:text-primary hover:bg-teal-50 dark:hover:bg-teal-900/20 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete"
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
      </div>
    </SwipeableRow>
  );
}

export default function Transactions() {
  const { state, dispatch } = useBudget();
  const { transactions } = getMonthData(state);
  const fmt = useFormat();
  const { push } = useToast();
  const { openQuickAdd } = useUI();
  const { query, setQuery } = useSearch();
  const deferredQuery = useDeferredValue(query);
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "saving">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const key = monthKey(state.currentYear, state.currentMonth);
  const monthStart = `${key}-01`;
  const monthEnd = `${key}-${String(
    daysInMonth(state.currentYear, state.currentMonth),
  ).padStart(2, "0")}`;

  const activeFilterCount =
    (minAmount !== "" ? 1 : 0) +
    (maxAmount !== "" ? 1 : 0) +
    (fromDate !== "" ? 1 : 0) +
    (toDate !== "" ? 1 : 0) +
    (accountFilter !== "all" ? 1 : 0);

  function clearFilters() {
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
    setAccountFilter("all");
  }

  const filtered = useMemo(() => {
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    const q = deferredQuery.toLowerCase();
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => {
        const matchesFilter =
          filter === "all" || t.type === (filter === "saving" ? "savings" : filter);
        const matchesSearch =
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note ?? "").toLowerCase().includes(q);
        const matchesMin = !min || min <= 0 || t.amount >= min;
        const matchesMax = !max || max <= 0 || t.amount <= max;
        const matchesFrom = !fromDate || t.date >= fromDate;
        const matchesTo = !toDate || t.date <= toDate;
        const matchesAccount =
          accountFilter === "all" ||
          t.accountId === accountFilter ||
          (t.type === "transfer" && t.toAccountId === accountFilter);
        return (
          matchesFilter &&
          matchesSearch &&
          matchesMin &&
          matchesMax &&
          matchesFrom &&
          matchesTo &&
          matchesAccount
        );
      });
  }, [
    transactions,
    filter,
    deferredQuery,
    minAmount,
    maxAmount,
    fromDate,
    toDate,
    accountFilter,
  ]);

  const { income, expense, saved } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const sav = transactions
      .filter((t) => t.type === "savings")
      .reduce((s, t) => s + t.amount, 0);
    return { income: inc, expense: exp, saved: sav };
  }, [transactions]);

  function handleDelete(tx: Transaction) {
    dispatch({ type: "DELETE_TRANSACTION", payload: { key, id: tx.id } });
    push({
      message: `Deleted "${tx.name}"`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () =>
          dispatch({ type: "ADD_TRANSACTION", payload: { ...tx } }),
      },
    });
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} this month
          </p>
        </div>
        <MonthNav />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Income",
            value: fmt(income),
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
          {
            label: "Expenses",
            value: fmt(expense),
            color: "text-rose-500 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
          },
          {
            label: "Saved",
            value: fmt(saved),
            color: "text-primary dark:text-primary-light",
            bg: "bg-teal-50 dark:bg-teal-900/20",
          },
          {
            label: "Balance",
            value: fmt(income - expense - saved),
            color:
              income - expense - saved >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-rose-500 dark:text-rose-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-card p-3 md:p-4 text-center`}
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
              {label}
            </p>
            <p
              className={`text-sm md:text-base font-black truncate ${color}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex sm:hidden items-center gap-3 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800/60 rounded-xl px-4 py-2.5 flex-1">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            data-search
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
              <span className="sr-only">Clear search</span>X
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(
            [
              ["all", "All"],
              ["income", "Income"],
              ["expense", "Expense"],
              ["saving", "Saving"],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`relative flex items-center gap-1 px-3 py-2 rounded-button border text-xs font-bold transition ${
              showFilters || activeFilterCount > 0
                ? "bg-primary/10 dark:bg-primary/20 border-primary/40 text-primary dark:text-teal-300"
                : "bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800/60 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <SlidersHorizontal size={13} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] leading-4 text-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => openQuickAdd("income")}
            className="flex items-center gap-1 px-3 py-2 rounded-button bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
          >
            <Plus size={13} /> Income
          </button>
          <button
            onClick={() => openQuickAdd("expense")}
            className="flex items-center gap-1 px-3 py-2 rounded-button bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
          >
            <Plus size={13} /> Expense
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-button bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800/60 text-gray-500 dark:text-gray-400 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <FileUp size={13} /> Import
          </button>
          <button
            onClick={() => {
              exportToCSV(transactions, key, state.currency);
              push({
                message: `Exported ${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`,
                tone: "success",
              });
            }}
            disabled={transactions.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-button bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold hover:bg-gray-700 dark:hover:bg-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800/60 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Filters
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div
            className={`grid grid-cols-2 gap-2.5 ${state.accounts.length > 1 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}
          >
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                Min amount
              </span>
              <input
                type="number"
                min={0}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                Max amount
              </span>
              <input
                type="number"
                min={0}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="∞"
                className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                From
              </span>
              <input
                type="date"
                value={fromDate}
                min={monthStart}
                max={monthEnd}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                To
              </span>
              <input
                type="date"
                value={toDate}
                min={monthStart}
                max={monthEnd}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
              />
            </label>
            {state.accounts.length > 1 && (
              <label className="block">
                <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Account
                </span>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
                >
                  <option value="all">All accounts</option>
                  {state.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      )}

      <Card padded={false}>
        <div className="p-4 md:p-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={
                query || activeFilterCount > 0
                  ? "No matching transactions"
                  : "No transactions yet"
              }
              description={
                query || activeFilterCount > 0
                  ? "Try adjusting your search or clearing filters"
                  : "Add your first income or expense above"
              }
            />
          ) : (
            <ShowMoreList
              items={filtered}
              pageSize={30}
              step={50}
              renderItem={(tx) => (
                <TxRow key={tx.id} tx={tx} onDelete={() => handleDelete(tx)} />
              )}
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <RecurringManager />
        <BudgetLimits />
      </div>

      <CsvImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
