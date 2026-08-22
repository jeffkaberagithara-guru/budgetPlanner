import { BudgetState, MonthData, Transaction } from "../types";
import { isCurrencyCode } from "../utils/currency";
import { DEFAULT_ACCOUNT } from "../utils/accounts";

const now = new Date();

export const CURRENT_VERSION = 5;

export const initialState: BudgetState = {
  version: CURRENT_VERSION,
  data: {},
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  recurringTemplates: [],
  goals: [],
  currency: "KES",
  settings: {
    rollover: false,
    autoApplyRecurring: true,
    spendingAlerts: true,
  },
  accounts: [{ ...DEFAULT_ACCOUNT }],
};

export const STORAGE_KEY = "budgetbold-data";

export function isValidBudgetState(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { data?: unknown }).data === "object" &&
    (value as { data?: unknown }).data !== null
  );
}

const TX_TYPES = ["income", "expense", "savings", "transfer"] as const;

function sanitizeTransactions(raw: unknown): Transaction[] {
  if (!Array.isArray(raw)) return [];
  const out: Transaction[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const x = t as Partial<Transaction>;
    const amount =
      typeof x.amount === "number" && Number.isFinite(x.amount)
        ? Math.abs(x.amount)
        : NaN;
    if (typeof x.id !== "string" || x.id.length === 0) continue;
    if (typeof x.name !== "string" || x.name.trim().length === 0) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (typeof x.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) continue;
    if (!TX_TYPES.includes(x.type as (typeof TX_TYPES)[number])) continue;
    out.push({
      id: x.id,
      name: x.name.slice(0, 80),
      amount,
      type: x.type as Transaction["type"],
      category:
        typeof x.category === "string" && x.category.length > 0
          ? x.category
          : x.type === "transfer"
            ? "Transfer"
            : "Other",
      date: x.date,
      note: typeof x.note === "string" ? x.note.slice(0, 140) : undefined,
      method: x.method,
      recurring: x.recurring === true ? true : undefined,
      frequency: x.frequency,
      goalId: typeof x.goalId === "string" ? x.goalId : undefined,
      accountId: typeof x.accountId === "string" ? x.accountId : undefined,
      toAccountId: typeof x.toAccountId === "string" ? x.toAccountId : undefined,
      pending: x.pending === true ? true : undefined,
    });
  }
  return out;
}

function sanitizeMonth(raw: unknown): MonthData {
  const m = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    transactions: sanitizeTransactions(m.transactions),
    savingsGoal:
      typeof m.savingsGoal === "number" && Number.isFinite(m.savingsGoal) && m.savingsGoal > 0
        ? m.savingsGoal
        : 0,
    budgetLimits: (Array.isArray(m.budgetLimits) ? m.budgetLimits : []).filter(
      (l): l is BudgetState["data"][string]["budgetLimits"][number] =>
        !!l &&
        typeof l === "object" &&
        typeof (l as { category?: unknown }).category === "string" &&
        typeof (l as { limit?: unknown }).limit === "number" &&
        Number.isFinite((l as { limit: number }).limit) &&
        (l as { limit: number }).limit > 0,
    ),
  };
}

function backfillAccounts(next: BudgetState): BudgetState {
  const accounts = Array.isArray(next.accounts) ? next.accounts : [];
  const usable = accounts.filter(
    (a) => !!a && typeof a.id === "string" && a.id.length > 0,
  );
  const withDefault =
    usable.length > 0
      ? usable.some((a) => a.id === DEFAULT_ACCOUNT.id)
        ? usable
        : [{ ...DEFAULT_ACCOUNT }, ...usable]
      : [{ ...DEFAULT_ACCOUNT }];
  const data: BudgetState["data"] = {};
  for (const [key, month] of Object.entries(next.data)) {
    data[key] = {
      ...month,
      transactions: month.transactions.map(
        (t): Transaction => (t.accountId ? t : { ...t, accountId: DEFAULT_ACCOUNT.id }),
      ),
    };
  }
  return { ...next, accounts: withDefault, data };
}

export function migrate(state: Record<string, unknown>): BudgetState {
  const raw =
    typeof state === "object" && state !== null ? state : {};
  const rawData =
    typeof raw.data === "object" && raw.data !== null ? raw.data : {};

  const data: BudgetState["data"] = {};
  for (const [key, month] of Object.entries(rawData)) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) continue;
    data[key] = sanitizeMonth(month);
  }

  const rawSettings =
    typeof raw.settings === "object" && raw.settings !== null
      ? (raw.settings as Record<string, unknown>)
      : {};

  const next: BudgetState = {
    version: CURRENT_VERSION,
    data,
    currentYear: Number.isInteger(raw.currentYear)
      ? (raw.currentYear as number)
      : initialState.currentYear,
    currentMonth:
      Number.isInteger(raw.currentMonth) &&
      (raw.currentMonth as number) >= 0 &&
      (raw.currentMonth as number) <= 11
        ? (raw.currentMonth as number)
        : initialState.currentMonth,
    recurringTemplates: Array.isArray(raw.recurringTemplates)
      ? raw.recurringTemplates.filter(
          (t): t is BudgetState["recurringTemplates"][number] =>
            !!t &&
            typeof t === "object" &&
            typeof (t as { id?: unknown }).id === "string" &&
            typeof (t as { name?: unknown }).name === "string" &&
            typeof (t as { amount?: unknown }).amount === "number",
        )
      : [],
    goals: Array.isArray(raw.goals)
      ? raw.goals.filter(
          (g): g is BudgetState["goals"][number] =>
            !!g &&
            typeof g === "object" &&
            typeof (g as { id?: unknown }).id === "string" &&
            typeof (g as { name?: unknown }).name === "string",
        )
      : [],
    currency: isCurrencyCode(raw.currency) ? raw.currency : "KES",
    settings: {
      rollover: rawSettings.rollover === true,
      autoApplyRecurring: rawSettings.autoApplyRecurring !== false,
      spendingAlerts: rawSettings.spendingAlerts !== false,
    },
    accounts: Array.isArray(raw.accounts) ? (raw.accounts as BudgetState["accounts"]) : [],
  };

  return backfillAccounts(next);
}

export function getEmptyMonth() {
  return { transactions: [], savingsGoal: 0, budgetLimits: [] };
}
