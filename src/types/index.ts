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

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO string
}

export interface MonthData {
  transactions: Transaction[];
  savingsGoal: number;
}

export interface BudgetState {
  data: Record<string, MonthData>;
  currentYear: number;
  currentMonth: number; // 0-indexed
}

export type BudgetAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: { key: string; id: string } }
  | { type: "CHANGE_MONTH"; payload: { year: number; month: number } }
  | { type: "SET_SAVINGS_GOAL"; payload: { key: string; goal: number } };