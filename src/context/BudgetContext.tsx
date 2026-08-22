import { useReducer, ReactNode, useEffect } from "react";
import { BudgetState, BudgetAction } from "../types";
import BudgetContext from "./budget-context";
import {
  STORAGE_KEY,
  initialState,
  migrate,
  getEmptyMonth,
} from "./budget-schema";
import { monthKey } from "../utils/budget";
import { DEFAULT_ACCOUNT_ID } from "../utils/accounts";
import { DEMO_DATA_KEY, isDemoActive } from "../utils/demo";

function activeStorageKey() {
  return isDemoActive() ? DEMO_DATA_KEY : STORAGE_KEY;
}

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(activeStorageKey());
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return initialState;
  }
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
    case "UPDATE_TRANSACTION": {
      const { oldKey, transaction } = action.payload;
      const newKey = transaction.date.slice(0, 7);
      const from = state.data[oldKey] ?? getEmptyMonth();
      const kept = from.transactions.filter((t) => t.id !== transaction.id);
      if (newKey === oldKey) {
        return {
          ...state,
          data: {
            ...state.data,
            [oldKey]: { ...from, transactions: [...kept, transaction] },
          },
        };
      }
      const to = state.data[newKey] ?? getEmptyMonth();
      return {
        ...state,
        data: {
          ...state.data,
          [oldKey]: { ...from, transactions: kept },
          [newKey]: { ...to, transactions: [...to.transactions, transaction] },
        },
      };
    }
    case "CHANGE_MONTH": {
      const fromKey = monthKey(state.currentYear, state.currentMonth);
      const toKey = monthKey(action.payload.year, action.payload.month);
      if (fromKey === toKey) {
        return {
          ...state,
          currentYear: action.payload.year,
          currentMonth: action.payload.month,
        };
      }
      const from = state.data[fromKey];
      const to = state.data[toKey];
      let nextState: BudgetState;
      if (
        from &&
        from.budgetLimits.length > 0 &&
        (!to || to.budgetLimits.length === 0)
      ) {
        nextState = {
          ...state,
          currentYear: action.payload.year,
          currentMonth: action.payload.month,
          data: {
            ...state.data,
            [toKey]: { ...getEmptyMonth(), ...to, budgetLimits: from.budgetLimits },
          },
        };
      } else {
        nextState = {
          ...state,
          currentYear: action.payload.year,
          currentMonth: action.payload.month,
        };
      }

      if (nextState.settings.autoApplyRecurring) {
        const existing = nextState.data[toKey] ?? getEmptyMonth();
        const alreadyApplied = new Set(
          existing.transactions.map((t) => t.name + t.amount + t.type),
        );
        const toAdd = nextState.recurringTemplates
          .filter(
            (t) =>
              t.frequency === "monthly" &&
              !alreadyApplied.has(t.name + t.amount + t.type),
          )
          .map((t) => ({
            ...t,
            id: crypto.randomUUID(),
            date: `${toKey}-01`,
          }));
        if (toAdd.length > 0) {
          nextState = {
            ...nextState,
            data: {
              ...nextState.data,
              [toKey]: {
                ...existing,
                transactions: [...existing.transactions, ...toAdd],
              },
            },
          };
        }
      }

      return nextState;
    }
    case "SET_CURRENCY":
      return { ...state, currency: action.payload };
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.patch } : g,
        ),
      };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
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
    case "UPDATE_RECURRING":
      return {
        ...state,
        recurringTemplates: state.recurringTemplates.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.patch } : t,
        ),
      };
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload.patch } : a,
        ),
      };
    case "DELETE_ACCOUNT": {
      const removedId = action.payload;
      const data: BudgetState["data"] = {};
      for (const [key, month] of Object.entries(state.data)) {
        data[key] = {
          ...month,
          transactions: month.transactions.map((t) =>
            t.accountId === removedId
              ? { ...t, accountId: DEFAULT_ACCOUNT_ID }
              : t,
          ),
        };
      }
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== removedId),
        data,
      };
    }
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
    case "RESTORE_STATE":
      return action.payload;
    default:
      return state;
  }
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, undefined, loadState);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(activeStorageKey(), JSON.stringify(state));
      } catch {
        console.warn("Failed to save to localStorage");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}
