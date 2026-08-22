import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { ElementType } from "react";
import { Account, AccountType, BudgetState } from "../types";

export const DEFAULT_ACCOUNT_ID = "acct-default";

export const DEFAULT_ACCOUNT: Account = {
  id: DEFAULT_ACCOUNT_ID,
  name: "Default",
  type: "other",
  openingBalance: 0,
  createdAt: new Date().toISOString().slice(0, 10),
};

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; icon: ElementType }
> = {
  cash: { label: "Cash", icon: Banknote },
  bank: { label: "Bank", icon: Landmark },
  mobile: { label: "Mobile Money", icon: Smartphone },
  card: { label: "Card", icon: CreditCard },
  other: { label: "Other", icon: Wallet },
};

export const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_META) as AccountType[];

export function accountName(state: BudgetState, accountId?: string): string {
  if (!accountId) return "Unassigned";
  return (
    state.accounts.find((a) => a.id === accountId)?.name ?? "Unassigned"
  );
}

export function accountBalance(state: BudgetState, accountId: string): number {
  const account = state.accounts.find((a) => a.id === accountId);
  let total = account?.openingBalance ?? 0;
  for (const month of Object.values(state.data)) {
    for (const t of month.transactions) {
      if (t.type === "transfer") {
        if (t.accountId === accountId) total -= t.amount;
        if (t.toAccountId === accountId) total += t.amount;
        continue;
      }
      if (t.accountId !== accountId) continue;
      if (t.type === "income") total += t.amount;
      else total -= t.amount;
    }
  }
  return total;
}

export function netWorth(state: BudgetState): number {
  return state.accounts.reduce(
    (sum, a) => sum + accountBalance(state, a.id),
    0,
  );
}

export function lowBalanceAccounts(
  state: BudgetState,
): { account: Account; balance: number }[] {
  return state.accounts
    .map((account) => ({ account, balance: accountBalance(state, account.id) }))
    .filter(
      ({ account, balance }) =>
        balance < 0 ||
        (account.lowBalanceThreshold !== undefined &&
          balance <= account.lowBalanceThreshold),
    );
}
