import {
  Account,
  BudgetAction,
  BudgetState,
  Category,
  Goal,
  MonthData,
  PaymentMethod,
  Transaction,
} from "../types";
import { STORAGE_KEY, initialState, migrate } from "../context/budget-schema";
import { monthKey } from "./budget";
import { daysInMonth, isoDate } from "./date";

export const DEMO_DATA_KEY = "budgetbold-demo";
export const DEMO_ACTIVE_KEY = "budgetbold-demo-active";
export const DEMO_EVENT = "budgetbold-demo-changed";

export function isDemoActive(): boolean {
  try {
    return localStorage.getItem(DEMO_ACTIVE_KEY) === "true";
  } catch {
    return false;
  }
}

export function loadRealState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return migrate(JSON.parse(raw));
  } catch {
    return initialState;
  }
}

export function enableDemo(dispatch: (action: BudgetAction) => void): void {
  const demo = createDemoState();
  try {
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(demo));
  } catch {
    console.warn("Failed to store demo data");
  }
  try {
    localStorage.setItem(DEMO_ACTIVE_KEY, "true");
  } catch {
    console.warn("Failed to enable demo mode");
  }
  window.dispatchEvent(new Event(DEMO_EVENT));
  dispatch({ type: "RESTORE_STATE", payload: demo });
}

export function disableDemo(dispatch: (action: BudgetAction) => void): void {
  try {
    localStorage.removeItem(DEMO_DATA_KEY);
    localStorage.removeItem(DEMO_ACTIVE_KEY);
  } catch {
    console.warn("Failed to clean up demo data");
  }
  window.dispatchEvent(new Event(DEMO_EVENT));
  dispatch({ type: "RESTORE_STATE", payload: loadRealState() });
}

type Rng = () => number;

function mulberry32(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng: Rng, min: number, max: number): number {
  return Math.round(min + rng() * (max - min));
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function makeTx(
  name: string,
  amount: number,
  type: Transaction["type"],
  category: Category,
  date: string,
  extra?: Partial<Transaction>,
): Transaction {
  return { id: crypto.randomUUID(), name, amount, type, category, date, ...extra };
}

const GROCERY_NAMES = [
  "Supermarket run",
  "Grocery restock",
  "Market vegetables",
  "Weekend shopping",
] as const;
const FARE_NAMES = ["Matatu fare", "Bus fare", "Boda ride"] as const;
const FUN_NAMES = [
  "Movie night",
  "Dinner out",
  "Concert tickets",
  "Coffee with friends",
] as const;
const SHOPPING_NAMES = [
  "Clothes",
  "Kitchen restock",
  "Phone accessories",
  "Book order",
] as const;
const HEALTH_NAMES = ["Pharmacy", "Clinic visit"] as const;
const EDU_NAMES = ["Online course", "Textbooks"] as const;
const METHODS = ["card", "cash", "mobile"] as const;

const BUDGET_LIMITS = [
  { category: "Food", limit: 15000 },
  { category: "Transport", limit: 8000 },
  { category: "Utilities", limit: 7000 },
  { category: "Entertainment", limit: 6000 },
  { category: "Shopping", limit: 7000 },
  { category: "Health", limit: 5000 },
] satisfies { category: Category; limit: number }[];

function recurringCopy(
  name: string,
  amount: number,
  type: Transaction["type"],
  category: Category,
  key: string,
  day: number,
  method: PaymentMethod,
): Transaction {
  return makeTx(name, amount, type, category, `${key}-${pad(day)}`, {
    method,
    recurring: true,
    frequency: "monthly",
  });
}

export function createDemoState(): BudgetState {
  const rng = mulberry32(42);
  const now = new Date();
  const today = now.getDate();

  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startKey = monthKey(start.getFullYear(), start.getMonth());

  const emergencyGoal: Goal = {
    id: crypto.randomUUID(),
    name: "Emergency Fund",
    targetAmount: 500000,
    allocationMode: "fixed",
    allocationValue: 10000,
    createdAt: `${startKey}-01`,
  };

  const laptopGoal: Goal = {
    id: crypto.randomUUID(),
    name: "New Laptop",
    targetAmount: 150000,
    targetDate: isoDate(new Date(now.getFullYear(), now.getMonth() + 6, 15)),
    allocationMode: "percent",
    allocationValue: 10,
    createdAt: `${startKey}-01`,
  };

  const recurringTemplates: Transaction[] = [
    recurringCopy("Monthly salary", 85000, "income", "Salary", startKey, 1, "bank"),
    recurringCopy("Rent", 25000, "expense", "Housing", startKey, 3, "bank"),
    recurringCopy("Streaming bundle", 1100, "expense", "Entertainment", startKey, 5, "card"),
    recurringCopy("Home fibre", 4500, "expense", "Utilities", startKey, 14, "mobile"),
  ];

  const demoAccounts: Account[] = [
    { id: "demo-bank", name: "Equity Bank", type: "bank", openingBalance: 45000, createdAt: `${startKey}-01`, lowBalanceThreshold: 10000 },
    { id: "demo-mpesa", name: "M-Pesa", type: "mobile", openingBalance: 3500, createdAt: `${startKey}-01`, lowBalanceThreshold: 1500 },
    { id: "demo-cash", name: "Cash", type: "cash", openingBalance: 2000, createdAt: `${startKey}-01`, lowBalanceThreshold: 500 },
  ];
  const accountForMethod = (m?: PaymentMethod) =>
    m === "cash" ? "demo-cash" : m === "mobile" ? "demo-mpesa" : "demo-bank";

  const data: Record<string, MonthData> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = monthKey(y, m);
    const maxDay = i === 0 ? today : daysInMonth(y, m);
    const txs: Transaction[] = [];

    txs.push(
      recurringCopy("Monthly salary", 85000, "income", "Salary", key, 1, "bank"),
    );

    if ((i === 3 || i === 5) && maxDay >= 12) {
      txs.push(
        makeTx(
          "Client project",
          between(rng, 12000, 28000),
          "income",
          "Freelance",
          `${key}-${pad(between(rng, 10, Math.min(20, maxDay)))}`,
          { method: "bank" },
        ),
      );
    }

    if (maxDay >= 3)
      txs.push(recurringCopy("Rent", 25000, "expense", "Housing", key, 3, "bank"));
    if (maxDay >= 5)
      txs.push(
        recurringCopy("Streaming bundle", 1100, "expense", "Entertainment", key, 5, "card"),
      );
    if (maxDay >= 14)
      txs.push(recurringCopy("Home fibre", 4500, "expense", "Utilities", key, 14, "mobile"));

    if (maxDay >= 8) {
      txs.push(
        makeTx(
          "Electricity bill",
          between(rng, 2200, 3600),
          "expense",
          "Utilities",
          `${key}-${pad(between(rng, 8, Math.min(14, maxDay)))}`,
          { method: "mobile" },
        ),
      );
    }

    const groceries = between(rng, 3, 5);
    for (let g = 0; g < groceries && maxDay >= 2; g++) {
      txs.push(
        makeTx(
          pick(rng, GROCERY_NAMES),
          between(rng, 900, 4200),
          "expense",
          "Food",
          `${key}-${pad(between(rng, 2, maxDay))}`,
          { method: pick(rng, METHODS) },
        ),
      );
    }

    const rides = between(rng, 4, 8);
    for (let r = 0; r < rides && maxDay >= 2; r++) {
      const roll = rng();
      const day = `${key}-${pad(between(rng, 2, maxDay))}`;
      if (roll < 0.55) {
        txs.push(
          makeTx(pick(rng, FARE_NAMES), between(rng, 60, 250), "expense", "Transport", day, {
            method: "cash",
          }),
        );
      } else if (roll < 0.8) {
        txs.push(makeTx("Bolt ride", between(rng, 300, 900), "expense", "Transport", day, { method: "mobile" }));
      } else {
        txs.push(makeTx("Fuel top-up", between(rng, 2200, 4200), "expense", "Transport", day, { method: "card" }));
      }
    }

    const fun = between(rng, 1, 3);
    for (let f = 0; f < fun && maxDay >= 4; f++) {
      txs.push(
        makeTx(
          pick(rng, FUN_NAMES),
          between(rng, 450, 4500),
          "expense",
          "Entertainment",
          `${key}-${pad(between(rng, 4, maxDay))}`,
          { method: pick(rng, METHODS) },
        ),
      );
    }

    if (rng() < 0.35 && maxDay >= 9) {
      txs.push(
        makeTx(
          pick(rng, SHOPPING_NAMES),
          between(rng, 1500, 8500),
          "expense",
          "Shopping",
          `${key}-${pad(between(rng, 9, maxDay))}`,
          { method: "card" },
        ),
      );
    }

    if (rng() < 0.25 && maxDay >= 11) {
      txs.push(
        makeTx(
          pick(rng, HEALTH_NAMES),
          between(rng, 400, 6500),
          "expense",
          "Health",
          `${key}-${pad(between(rng, 11, maxDay))}`,
          { method: "cash" },
        ),
      );
    }

    if (rng() < 0.18 && maxDay >= 16) {
      txs.push(
        makeTx(
          pick(rng, EDU_NAMES),
          between(rng, 1200, 5500),
          "expense",
          "Education",
          `${key}-${pad(between(rng, 16, maxDay))}`,
          { method: "card" },
        ),
      );
    }

    if (maxDay >= 26) {
      txs.push(
        makeTx(
          "Emergency fund transfer",
          between(rng, 8000, 15000),
          "savings",
          "Savings",
          `${key}-26`,
          { goalId: emergencyGoal.id, method: "bank" },
        ),
      );
    }

    if ((i === 2 || i === 4 || (i === 0 && today >= 20)) && maxDay >= 20) {
      txs.push(
        makeTx(
          "Laptop fund top-up",
          between(rng, 3000, 6000),
          "savings",
          "Savings",
          `${key}-20`,
          { goalId: laptopGoal.id, method: "bank" },
        ),
      );
    }

    if (i === 0 && maxDay >= 10) {
      txs.push({
        id: crypto.randomUUID(),
        name: "Transfer to M-Pesa",
        amount: between(rng, 2500, 4000),
        type: "transfer",
        category: "Transfer",
        date: `${key}-10`,
        accountId: "demo-bank",
        toAccountId: "demo-mpesa",
      });
    }

    txs.forEach((t) => {
      t.accountId = accountForMethod(t.method);
    });

    const pendingIdx = txs.findIndex(
      (t) => i === 0 && t.type === "expense" && t.category === "Utilities",
    );
    if (pendingIdx !== -1) txs[pendingIdx].pending = true;

    data[key] = {
      transactions: txs,
      savingsGoal: 15000,
      budgetLimits: BUDGET_LIMITS.map((l) => ({ ...l })),
    };
  }

  return {
    ...initialState,
    data,
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    recurringTemplates,
    goals: [emergencyGoal, laptopGoal],
    accounts: demoAccounts,
  };
}
