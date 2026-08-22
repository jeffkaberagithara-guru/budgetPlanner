import { BudgetState, Category, MonthData } from "../types";

export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getMonthData(state: BudgetState): MonthData {
  const key = monthKey(state.currentYear, state.currentMonth);
  return (
    state.data[key] ?? {
      transactions: [],
      savingsGoal: 0,
      budgetLimits: [],
    }
  );
}

export function getMonthTotals(month?: MonthData) {
  const income =
    month?.transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const expense =
    month?.transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const saved =
    month?.transactions
      .filter((t) => t.type === "savings")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  return { income, expense, saved, balance: income - expense - saved };
}

export function previousKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function categorySpent(month: MonthData, category: Category): number {
  return month.transactions
    .filter((t) => t.type === "expense" && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}

export function getEffectiveLimit(
  state: BudgetState,
  key: string,
  category: Category,
): number | null {
  const base = state.data[key]?.budgetLimits.find(
    (l) => l.category === category,
  );
  if (!base) return null;
  if (!state.settings.rollover) return base.limit;

  let carried = 0;
  for (const [k, month] of Object.entries(state.data)) {
    if (k >= key) continue;
    const limit = month.budgetLimits.find((l) => l.category === category);
    if (!limit) continue;
    carried += Math.max(0, limit.limit - categorySpent(month, category));
  }
  return base.limit + carried;
}
