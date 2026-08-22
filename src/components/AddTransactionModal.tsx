import { useMemo, useState } from "react";
import { X, AlertTriangle, Repeat, ArrowRight } from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import { getMonthData, monthKey } from "../utils/budget";
import { Category, TransactionType, PaymentMethod } from "../types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../utils/categories";
import { daysInMonth, defaultTransactionDate } from "../utils/date";
import { PAYMENT_METHODS } from "../utils/payment-methods";
import { accountName } from "../utils/accounts";
import type { EditingTx } from "../context/ui-context";

interface Props {
  open: boolean;
  defaultType: TransactionType;
  editing?: EditingTx | null;
  onClose: () => void;
}

function TransactionForm({
  defaultType,
  editing,
  onClose,
}: {
  defaultType: TransactionType;
  editing?: EditingTx | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useBudget();
  const { push } = useToast();
  const [type, setType] = useState<TransactionType>(editing?.tx.type ?? defaultType);
  const [name, setName] = useState(editing?.tx.name ?? "");
  const [amount, setAmount] = useState(
    editing ? String(editing.tx.amount) : "",
  );
  const [category, setCategory] = useState<Category | "Transfer">(
    editing?.tx.category ??
      (defaultType === "income"
        ? "Salary"
        : defaultType === "savings"
          ? "Savings"
          : defaultType === "transfer"
            ? "Transfer"
            : "Housing"),
  );
  const [note, setNote] = useState(editing?.tx.note ?? "");
  const [method, setMethod] = useState<PaymentMethod | "">(
    editing?.tx.method ?? "",
  );
  const [accountId, setAccountId] = useState<string>(
    editing?.tx.accountId ?? state.accounts[0]?.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState<string>(
    editing?.tx.toAccountId ??
      state.accounts.find((a) => a.id !== (editing?.tx.accountId ?? state.accounts[0]?.id))
        ?.id ??
      state.accounts[1]?.id ??
      "",
  );
  const [pending, setPending] = useState<boolean>(editing?.tx.pending ?? false);
  const [date, setDate] = useState(() =>
    editing ? editing.tx.date : defaultTransactionDate(state.currentYear, state.currentMonth),
  );
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [syncTemplate, setSyncTemplate] = useState(false);

  const linkedTemplates = useMemo(() => {
    if (!editing?.tx.recurring) return [];
    return state.recurringTemplates.filter(
      (t) => t.name === editing.tx.name && t.type === editing.tx.type,
    );
  }, [state.recurringTemplates, editing]);

  const cats =
    type === "income" ? INCOME_CATEGORIES : type === "expense" ? EXPENSE_CATEGORIES : null;
  const key = monthKey(state.currentYear, state.currentMonth);
  const monthStart = `${key}-01`;
  const monthEnd = `${key}-${String(
    daysInMonth(state.currentYear, state.currentMonth),
  ).padStart(2, "0")}`;

  const parsedAmount = parseFloat(amount);
  const isDuplicate = useMemo(() => {
    if (editing) return false;
    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return false;
    return getMonthData(state).transactions.some(
      (t) =>
        t.name.toLowerCase() === name.trim().toLowerCase() &&
        t.amount === parsedAmount &&
        t.date === date,
    );
  }, [state, name, parsedAmount, date, editing]);

  function handleNameChange(value: string) {
    setName(value);
    setAllowDuplicate(false);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    setAllowDuplicate(false);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setAllowDuplicate(false);
  }

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategory(
      t === "income"
        ? "Salary"
        : t === "savings"
          ? "Savings"
          : t === "transfer"
            ? "Transfer"
            : "Housing",
    );
    if (t === "transfer" && !name.trim()) setName("Transfer");
    setAllowDuplicate(false);
  }

  const isTransfer = type === "transfer";
  const transferInvalid =
    isTransfer && (!toAccountId || toAccountId === accountId);

  function handleSave() {
    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return;
    if (transferInvalid) return;
    if (!editing && isDuplicate && !allowDuplicate) {
      setAllowDuplicate(true);
      return;
    }
    const transferFields = isTransfer
      ? { toAccountId }
      : { toAccountId: undefined };
    if (editing) {
      const keepGoal =
        type === "savings" && type === editing.tx.type
          ? editing.tx.goalId
          : undefined;
      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: {
          oldKey: editing.key,
          transaction: {
            ...editing.tx,
            name: name.trim(),
            amount: parsedAmount,
            type,
            category: isTransfer ? "Transfer" : category,
            date,
            note: note.trim() || undefined,
            method: method || undefined,
            accountId: accountId || undefined,
            goalId: keepGoal,
            pending: pending || undefined,
            ...transferFields,
          },
        },
      });
      if (syncTemplate) {
        linkedTemplates.forEach((tpl) =>
          dispatch({
            type: "UPDATE_RECURRING",
            payload: {
              id: tpl.id,
              patch: {
                name: name.trim(),
                amount: parsedAmount,
                type,
                category,
                method: method || undefined,
              },
            },
          }),
        );
      }
      push({
        message:
          syncTemplate && linkedTemplates.length > 0
            ? `Updated "${name.trim()}" and its template`
            : `Updated "${name.trim()}"`,
        tone: "success",
      });
      onClose();
      return;
    }
    const safeDate =
      date >= monthStart && date <= monthEnd ? date : monthStart;
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: parsedAmount,
        type,
        category: isTransfer ? "Transfer" : category,
        date: safeDate,
        note: note.trim() || undefined,
        method: method || undefined,
        accountId: accountId || undefined,
        pending: pending || undefined,
        ...transferFields,
      },
    });
    onClose();
  }

  return (
    <div
      className="bg-white dark:bg-surface-dark rounded-2xl sm:rounded-2xl rounded-t-3xl shadow-modal w-full max-w-md p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle bar — mobile */}
      <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5 sm:hidden" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          {editing ? "Edit Transaction" : "Add Transaction"}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(
          [
            ["income", "Income", "bg-emerald-500"],
            ["expense", "Expense", "bg-rose-500"],
            ["savings", "Saving", "bg-primary"],
            ["transfer", "Transfer", "bg-blue-500"],
          ] as const
        ).map(([t, label, activeBg]) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              type === t
                ? `${activeBg} text-white shadow`
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Description
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Salary, Rent, Groceries..."
          className="w-full px-4 py-3 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          min={0}
          className="w-full px-4 py-3 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>

      {/* Date */}
      <div className="mb-4">
        <label
          htmlFor="transaction-date"
          className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
        >
          Date
        </label>
        <input
          id="transaction-date"
          type="date"
          value={date}
          min={editing ? undefined : monthStart}
          max={editing ? undefined : monthEnd}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-4 py-3 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        {editing ? (
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">
            Changing the month moves this entry there.
          </p>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">
            Dates are limited to{" "}
            {new Date(state.currentYear, state.currentMonth).toLocaleDateString(
              undefined,
              { month: "long", year: "numeric" },
            )}
            . Use the arrows on the dashboard to switch months.
          </p>
        )}
      </div>

      {/* Note */}
      <div className="mb-4">
        <label
          htmlFor="transaction-note"
          className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
        >
          Note{" "}
          <span className="font-medium normal-case tracking-normal">
            (optional)
          </span>
        </label>
        <input
          id="transaction-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Split with roommate"
          maxLength={140}
          className="w-full px-4 py-3 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>

      {/* Payment method — hidden for transfers */}
      {!isTransfer && (
        <div className="mb-4">
          <label
            htmlFor="transaction-method"
            className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
          >
            Paid via{" "}
            <span className="font-medium normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <select
            id="transaction-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}
            className={`w-full px-4 py-3 rounded-input border bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${
              method
                ? "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                : "border-gray-100 dark:border-gray-700/60 text-gray-300 dark:text-gray-600"
            }`}
          >
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Account */}
      {state.accounts.length > 0 && (
        <div className={`mb-4 ${isTransfer ? "" : ""}`}>
          <label
            htmlFor="transaction-account"
            className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
          >
            {isTransfer ? "From account" : "Account"}
          </label>
          <select
            id="transaction-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={`w-full px-4 py-3 rounded-input border bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 ${
              state.accounts.length === 1 && !isTransfer ? "opacity-70" : ""
            }`}
          >
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Transfer destination */}
      {isTransfer && state.accounts.length > 0 && (
        <div className="mb-4">
          <label
            htmlFor="transaction-to-account"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
          >
            To account
          </label>
          <select
            id="transaction-to-account"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className={`w-full px-4 py-3 rounded-input border bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${
              toAccountId === accountId
                ? "border-rose-300 dark:border-rose-700 text-rose-500"
                : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
            }`}
          >
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountName(state, a.id)}
              </option>
            ))}
          </select>
          {transferInvalid ? (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-500 mt-1.5">
              <ArrowRight size={12} /> Pick a different destination account.
            </p>
          ) : (
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">
              Money leaves{" "}
              <span className="font-semibold">{accountName(state, accountId)}</span>{" "}
              and arrives in{" "}
              <span className="font-semibold">
                {accountName(state, toAccountId)}
              </span>
              . Totals and reports stay untouched.
            </p>
          )}
        </div>
      )}

      {/* Category — hidden for savings and transfers */}
      {cats ? (
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`py-2 px-3 rounded-input text-xs font-semibold text-left transition-all border ${
                  category === c
                    ? type === "income"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
                    : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        !isTransfer && (
          <p className="text-xs text-gray-300 dark:text-gray-600 mb-6">
            Recorded as{" "}
            <span className="font-bold text-primary dark:text-primary-light">Savings</span>{" "}
            and reduces this month's available balance. Link it to a goal from the
            Savings page.
          </p>
        )
      )}

      {/* Pending */}
      <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={pending}
          onChange={(e) => setPending(e.target.checked)}
          className="w-4 h-4 accent-blue-500 shrink-0"
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Mark as pending{" "}
          <span className="normal-case">
            (recorded now, flagged until the money actually moves)
          </span>
        </span>
      </label>

      {/* Duplicate warning */}
      {isDuplicate && (
        <div className="flex items-start gap-2.5 p-3 mb-4 rounded-card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {allowDuplicate
              ? "Press Add Anyway to save this duplicate."
              : `A transaction named "${name.trim()}" for the same amount already exists on this date.`}
          </p>
        </div>
      )}

      {/* Recurring template sync */}
      {editing && linkedTemplates.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 mb-4 rounded-card bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <Repeat size={15} className="text-primary dark:text-primary-light shrink-0 mt-0.5" />
          <label className="flex items-start gap-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={syncTemplate}
              onChange={(e) => setSyncTemplate(e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 accent-teal-500 shrink-0"
            />
            <span>
              This entry comes from a recurring template.{" "}
              <span className="font-bold">
                Also update {linkedTemplates.length > 1 ? "the matching templates" : "the template"}
              </span>{" "}
              so future months use these details.
            </span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-button border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={
            !name.trim() || !parsedAmount || parsedAmount <= 0 || transferInvalid
          }
          className={`flex-1 py-3 rounded-button text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
            type === "income"
              ? "bg-emerald-500 hover:bg-emerald-600"
              : type === "savings"
                ? "bg-primary hover:bg-primary-dark"
                : isTransfer
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-rose-500 hover:bg-rose-600"
          }`}
        >
          {editing
            ? "Save Changes"
            : isDuplicate && allowDuplicate
              ? "Add Anyway"
              : isTransfer
                ? "Transfer"
                : "Save Transaction"}
        </button>
      </div>
    </div>
  );
}

export default function AddTransactionModal({
  open,
  defaultType,
  editing,
  onClose,
}: Props) {
  const { state } = useBudget();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <TransactionForm
        key={
          editing
            ? `edit-${editing.key}-${editing.tx.id}`
            : monthKey(state.currentYear, state.currentMonth)
        }
        defaultType={defaultType}
        editing={editing}
        onClose={onClose}
      />
    </div>
  );
}
