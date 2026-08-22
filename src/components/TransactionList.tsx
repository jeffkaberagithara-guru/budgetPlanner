import { useMemo } from "react";
import { Pencil, Trash2, Wallet, Landmark, ArrowRight } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthData, monthKey } from "../utils/budget";
import { useToast } from "../hooks/useToast";
import { useUI } from "../hooks/useUI";
import { Transaction } from "../types";
import { formatDate } from "../utils/date";
import { PAYMENT_METHOD_META } from "../utils/payment-methods";
import { CATEGORY_DOT, CATEGORY_BADGE } from "../utils/categories";
import { accountName } from "../utils/accounts";
import EmptyState from "./EmptyState";
import ShowMoreList from "./ShowMoreList";
import SwipeableRow from "./SwipeableRow";

function TxRow({ tx }: { tx: Transaction }) {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const { openEditTransaction } = useUI();
  const rowKey = monthKey(state.currentYear, state.currentMonth);

  function handleDelete() {
    dispatch({ type: "DELETE_TRANSACTION", payload: { key: rowKey, id: tx.id } });
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
    <SwipeableRow
      onDelete={handleDelete}
      label={`Delete ${tx.name}`}
      className="border-b border-gray-50 dark:border-gray-800/60 last:border-0"
    >
      <div className="flex items-center gap-3 py-3 group">
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
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[tx.category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
          >
            {tx.category}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">
            {formatDate(tx.date)}
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
        onClick={() => openEditTransaction(rowKey, tx)}
        aria-label={`Edit ${tx.name}`}
        className="p-1.5 rounded-lg text-gray-300 hover:text-primary hover:bg-teal-50 dark:hover:bg-teal-900/20 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={handleDelete}
        aria-label="Delete transaction"
        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition lg:opacity-0 lg:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
      </div>
    </SwipeableRow>
  );
}

export default function TransactionList() {
  const { state } = useBudget();
  const { transactions } = getMonthData(state);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No transactions yet"
        description="Add your first income or expense above"
      />
    );
  }

  return (
    <ShowMoreList
      items={sorted}
      pageSize={12}
      step={30}
      renderItem={(tx) => <TxRow key={tx.id} tx={tx} />}
    />
  );
}
