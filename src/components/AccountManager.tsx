import { useState } from "react";
import { Check, Landmark, Pencil, Plus, Trash2, X } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import Card from "./Card";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_META,
  DEFAULT_ACCOUNT_ID,
  accountBalance,
} from "../utils/accounts";
import type { Account, AccountType } from "../types";
import { isoDate } from "../utils/date";

interface FormState {
  name: string;
  type: AccountType;
  opening: string;
  threshold: string;
}

const EMPTY_FORM: FormState = { name: "", type: "bank", opening: "", threshold: "" };

export default function AccountManager() {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  function startAdd() {
    setForm(EMPTY_FORM);
    setAdding(true);
    setEditId(null);
  }

  function startEdit(account: Account) {
    setEditId(account.id);
    setEditForm({
      name: account.name,
      type: account.type,
      opening: String(account.openingBalance),
      threshold:
        account.lowBalanceThreshold !== undefined
          ? String(account.lowBalanceThreshold)
          : "",
    });
    setAdding(false);
  }

  function cancelAll() {
    setAdding(false);
    setEditId(null);
  }

  function saveNew() {
    const name = form.name.trim();
    if (!name) return;
    const threshold = Number(form.threshold);
    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        id: crypto.randomUUID(),
        name,
        type: form.type,
        openingBalance: Math.max(0, Number(form.opening) || 0),
        createdAt: isoDate(new Date()),
        lowBalanceThreshold:
          Number.isFinite(threshold) && threshold > 0 ? threshold : undefined,
      },
    });
    push({ message: `Account "${name}" created`, tone: "success" });
    cancelAll();
  }

  function saveEdit() {
    if (!editId) return;
    const name = editForm.name.trim();
    if (!name) return;
    const threshold = Number(editForm.threshold);
    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: {
        id: editId,
        patch: {
          name,
          type: editForm.type,
          openingBalance: Math.max(0, Number(editForm.opening) || 0),
          lowBalanceThreshold:
            Number.isFinite(threshold) && threshold > 0 ? threshold : undefined,
        },
      },
    });
    push({ message: `Account "${name}" updated`, tone: "success" });
    cancelAll();
  }

  function handleDelete(account: Account) {
    dispatch({ type: "DELETE_ACCOUNT", payload: account.id });
    push({
      message: `"${account.name}" removed — its transactions moved to Default`,
      tone: "info",
    });
  }

  const inputClass =
    "w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition";

  function renderForm(
    values: FormState,
    setValues: (v: FormState) => void,
    onSave: () => void,
  ) {
    return (
      <form
        noValidate
        className="p-3 rounded-card border border-teal-200 dark:border-teal-800/60 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (values.name.trim()) onSave();
        }}
      >
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="Account name (e.g. M-Pesa)"
          className={inputClass}
          autoFocus
        />
        <div className="grid grid-cols-5 gap-1.5">
          {ACCOUNT_TYPES.map((t) => {
            const Meta = ACCOUNT_TYPE_META[t];
            const Icon = Meta.icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setValues({ ...values, type: t })}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-button text-[10px] font-bold transition-all border ${
                  values.type === t
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-primary dark:text-primary-light"
                    : "border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <Icon size={14} />
                {Meta.label}
              </button>
            );
          })}
        </div>
        <label className="block">
          <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Opening balance
          </span>
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={values.opening}
            onChange={(e) => setValues({ ...values, opening: e.target.value })}
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Low-balance alert at{" "}
            <span className="normal-case font-medium">(optional)</span>
          </span>
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={values.threshold}
            onChange={(e) => setValues({ ...values, threshold: e.target.value })}
            placeholder="No alert"
            className={inputClass}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!values.name.trim()}
            className="flex-1 py-2 rounded-button bg-primary hover:bg-primary-dark text-white text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <Check size={13} /> Save Account
          </button>
          <button
            type="button"
            onClick={cancelAll}
            className="px-4 py-2 rounded-button border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-icon bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Landmark size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Accounts
          </h2>
        </div>
        {!adding && editId === null && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-primary/10 text-primary dark:text-primary-light text-xs font-bold hover:bg-primary/20 transition"
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {adding && <div className="mb-3">{renderForm(form, setForm, saveNew)}</div>}

      <div className="space-y-2">
        {state.accounts.map((account) => {
          const Meta = ACCOUNT_TYPE_META[account.type];
          const Icon = Meta.icon;
          const balance = accountBalance(state, account.id);
          const isDefault = account.id === DEFAULT_ACCOUNT_ID;
          return (
            <div key={account.id}>
              {editId === account.id ? (
                renderForm(editForm, setEditForm, saveEdit)
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 group">
                  <div className="p-1.5 rounded-icon bg-white dark:bg-gray-700 text-gray-500 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex items-center gap-1.5">
                      {account.name}
                      {isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 font-bold uppercase tracking-wide">
                          default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {Meta.label}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-black shrink-0 ${
                      balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {balance < 0 ? "-" : ""}
                    {fmt(Math.abs(balance))}
                  </p>
                  <div className="flex gap-1 shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition">
                    <button
                      onClick={() => startEdit(account)}
                      aria-label={`Edit ${account.name}`}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-primary hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
                    >
                      <Pencil size={13} />
                    </button>
                    {!isDefault && state.accounts.length > 1 && (
                      <button
                        onClick={() => handleDelete(account)}
                        aria-label={`Delete ${account.name}`}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(adding || editId !== null) && (
        <button
          onClick={cancelAll}
          className="mt-3 mx-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X size={12} /> Close
        </button>
      )}
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-3">
        Balances combine each account's opening amount with the transactions
        tagged to it. Deleting an account moves its transactions to Default.
      </p>
    </Card>
  );
}
