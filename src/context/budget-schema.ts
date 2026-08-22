import { BudgetState, Transaction } from "../types";
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
  },
  accounts: [{ ...DEFAULT_ACCOUNT }],
};

export const STORAGE_KEY = "budgetbold-data";

export function isValidBudgetState(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { data?: unknown }).data === "object"
  );
}

function backfillAccounts(next: BudgetState): BudgetState {
  const accounts = Array.isArray(next.accounts) ? next.accounts : [];
  const withDefault =
    accounts.length > 0 ? accounts : [{ ...DEFAULT_ACCOUNT }];
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
  const version = (state.version as number) ?? 0;

  if (version < CURRENT_VERSION || !Array.isArray(state.recurringTemplates)) {
    const next = {
      ...initialState,
      ...(state as unknown as BudgetState),
    };
    if (!isCurrencyCode(next.currency)) {
      next.currency = "KES";
    }
    next.settings = {
      ...initialState.settings,
      ...((state.settings as Partial<BudgetState["settings"]>) ?? {}),
    };
    if (!Array.isArray(state.goals)) {
      next.goals = [];
    }
    if (!Array.isArray(state.recurringTemplates)) {
      next.recurringTemplates = [];
    }
    return { ...backfillAccounts(next), version: CURRENT_VERSION };
  }

  return backfillAccounts({ ...(state as unknown as BudgetState) });
}

export function getEmptyMonth() {
  return { transactions: [], savingsGoal: 0, budgetLimits: [] };
}
