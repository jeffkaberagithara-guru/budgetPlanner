export type TransactionType = "income" | "expense" | "savings" | "transfer";

export type Category =
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Other Income"
  | "Housing"
  | "Food"
  | "Transport"
  | "Health"
  | "Entertainment"
  | "Shopping"
  | "Utilities"
  | "Education"
  | "Savings"
  | "Other";

export type RecurringFrequency = "monthly" | "weekly" | "yearly";

export type PaymentMethod = "cash" | "card" | "mobile" | "bank";

export type AccountType = "cash" | "bank" | "mobile" | "card" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  createdAt: string;
  lowBalanceThreshold?: number;
}

export interface BudgetSettings {
  rollover: boolean;
  autoApplyRecurring: boolean;
  spendingAlerts?: boolean;
}

export interface Profile {
  name: string;
  email: string;
}

export type CurrencyCode = "KES" | "USD" | "EUR" | "GBP" | "UGX" | "TZS" | "ZAR";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: Category | "Transfer";
  date: string;
  note?: string;
  method?: PaymentMethod;
  recurring?: boolean;
  frequency?: RecurringFrequency;
  goalId?: string;
  accountId?: string;
  toAccountId?: string;
  pending?: boolean;
}

export type AllocationMode = "off" | "fixed" | "percent";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
  allocationMode: AllocationMode;
  allocationValue: number;
  createdAt: string;
}

export interface BudgetLimit {
  category: Category;
  limit: number;
}

export interface MonthData {
  transactions: Transaction[];
  savingsGoal: number;
  budgetLimits: BudgetLimit[];
}

export interface BudgetState {
  version: number;
  data: Record<string, MonthData>;
  currentYear: number;
  currentMonth: number;
  recurringTemplates: Transaction[];
  goals: Goal[];
  currency: CurrencyCode;
  settings: BudgetSettings;
  accounts: Account[];
}

export type BudgetAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: { key: string; id: string } }
  | {
      type: "UPDATE_TRANSACTION";
      payload: { oldKey: string; transaction: Transaction };
    }
  | { type: "CHANGE_MONTH"; payload: { year: number; month: number } }
  | { type: "SET_CURRENCY"; payload: CurrencyCode }
  | { type: "SET_SETTINGS"; payload: Partial<BudgetSettings> }
  | { type: "SET_SAVINGS_GOAL"; payload: { key: string; goal: number } }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: { id: string; patch: Partial<Goal> } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "SET_BUDGET_LIMIT"; payload: { key: string; limit: BudgetLimit } }
  | {
      type: "REMOVE_BUDGET_LIMIT";
      payload: { key: string; category: Category };
    }
  | { type: "ADD_RECURRING"; payload: Transaction }
  | {
      type: "UPDATE_RECURRING";
      payload: { id: string; patch: Partial<Transaction> };
    }
  | { type: "REMOVE_RECURRING"; payload: string }
  | { type: "APPLY_RECURRING"; payload: { key: string } }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | {
      type: "UPDATE_ACCOUNT";
      payload: { id: string; patch: Partial<Omit<Account, "id">> };
    }
  | { type: "DELETE_ACCOUNT"; payload: string }
  | { type: "RESTORE_STATE"; payload: BudgetState };