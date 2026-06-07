export type TransactionType = "income" | "expense";

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
  | "Other";

export type RecurringFrequency = "monthly" | "weekly" | "yearly";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  recurring?: boolean;
  frequency?: RecurringFrequency;
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
  data: Record<string, MonthData>;
  currentYear: number;
  currentMonth: number;
  recurringTemplates: Transaction[];
}

export type BudgetAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: { key: string; id: string } }
  | { type: "CHANGE_MONTH"; payload: { year: number; month: number } }
  | { type: "SET_SAVINGS_GOAL"; payload: { key: string; goal: number } }
  | { type: "SET_BUDGET_LIMIT"; payload: { key: string; limit: BudgetLimit } }
  | {
      type: "REMOVE_BUDGET_LIMIT";
      payload: { key: string; category: Category };
    }
  | { type: "ADD_RECURRING"; payload: Transaction }
  | { type: "REMOVE_RECURRING"; payload: string }
  | { type: "APPLY_RECURRING"; payload: { key: string } };