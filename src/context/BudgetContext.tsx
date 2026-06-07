import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  BudgetState,
  BudgetAction,
  MonthData,
  BudgetLimit,
  Category,
} from "../types";

const now = new Date();

const initialState: BudgetState = {
  data: {},
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  recurringTemplates: [],
};

const STORAGE_KEY = "budgetbold-data";

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

function getEmptyMonth(): MonthData {
  return { transactions: [], savingsGoal: 0, budgetLimits: [] };
}

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const key = action.payload.date.slice(0, 7);
      const existing = state.data[key] ?? getEmptyMonth();
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
      const existing = state.data[key] ?? getEmptyMonth();
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
      const existing = state.data[key] ?? getEmptyMonth();
      return {
        ...state,
        data: { ...state.data, [key]: { ...existing, savingsGoal: goal } },
      };
    }
    case "SET_BUDGET_LIMIT": {
      const { key, limit } = action.payload;
      const existing = state.data[key] ?? getEmptyMonth();
      const limits = existing.budgetLimits.filter(
        (l) => l.category !== limit.category,
      );
      return {
        ...state,
        data: {
          ...state.data,
          [key]: { ...existing, budgetLimits: [...limits, limit] },
        },
      };
    }
    case "REMOVE_BUDGET_LIMIT": {
      const { key, category } = action.payload;
      const existing = state.data[key] ?? getEmptyMonth();
      return {
        ...state,
        data: {
          ...state.data,
          [key]: {
            ...existing,
            budgetLimits: existing.budgetLimits.filter(
              (l) => l.category !== category,
            ),
          },
        },
      };
    }
    case "ADD_RECURRING":
      return {
        ...state,
        recurringTemplates: [...state.recurringTemplates, action.payload],
      };
    case "REMOVE_RECURRING":
      return {
        ...state,
        recurringTemplates: state.recurringTemplates.filter(
          (t) => t.id !== action.payload,
        ),
      };
    case "APPLY_RECURRING": {
      const { key } = action.payload;
      const existing = state.data[key] ?? getEmptyMonth();
      const alreadyApplied = new Set(
        existing.transactions.map((t) => t.name + t.amount + t.type),
      );
      const toAdd = state.recurringTemplates
        .filter((t) => !alreadyApplied.has(t.name + t.amount + t.type))
        .map((t) => ({ ...t, id: crypto.randomUUID(), date: `${key}-01` }));
      if (toAdd.length === 0) return state;
      return {
        ...state,
        data: {
          ...state.data,
          [key]: {
            ...existing,
            transactions: [...existing.transactions, ...toAdd],
          },
        },
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
  return state.data[key] ?? getEmptyMonth();
}

interface BudgetContextType {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      console.warn("Failed to save to localStorage");
    }
  }, [state]);

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