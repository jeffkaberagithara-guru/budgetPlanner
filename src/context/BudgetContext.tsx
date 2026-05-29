import { createContext, useContext, useReducer, ReactNode } from "react";
import { BudgetState, BudgetAction, MonthData } from "../types";

const now = new Date();

const initialState: BudgetState = {
  data: {},
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
};

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const key = action.payload.date.slice(0, 7);
      const existing = state.data[key] ?? { transactions: [], savingsGoal: 0 };
      return {
        ...state,
        data: {
          ...state.data,
          [key]: {
            ...existing,
            transactions: [...existing.transactions, action.payload],
          },
        },
      };
    }
    case "DELETE_TRANSACTION": {
      const { key, id } = action.payload;
      const existing = state.data[key] ?? { transactions: [], savingsGoal: 0 };
      return {
        ...state,
        data: {
          ...state.data,
          [key]: {
            ...existing,
            transactions: existing.transactions.filter((t) => t.id !== id),
          },
        },
      };
    }
    case "CHANGE_MONTH":
      return {
        ...state,
        currentYear: action.payload.year,
        currentMonth: action.payload.month,
      };
    case "SET_SAVINGS_GOAL": {
      const { key, goal } = action.payload;
      const existing = state.data[key] ?? { transactions: [], savingsGoal: 0 };
      return {
        ...state,
        data: { ...state.data, [key]: { ...existing, savingsGoal: goal } },
      };
    }
    default:
      return state;
  }
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getMonthData(state: BudgetState): MonthData {
  const key = monthKey(state.currentYear, state.currentMonth);
  return state.data[key] ?? { transactions: [], savingsGoal: 0 };
}

interface BudgetContextType {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
