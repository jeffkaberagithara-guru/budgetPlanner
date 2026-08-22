import { BudgetState, RecurringFrequency, TransactionType } from "../types";

export function lastMonthKeys(currentKey: string, count: number): string[] {
  const keys: string[] = [];
  let [y, m] = currentKey.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    keys.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m--;
    if (m === 0) {
      m = 12;
      y--;
    }
  }
  return keys;
}

export function monthlyEquivalent(
  amount: number,
  frequency?: RecurringFrequency,
): number {
  if (frequency === "weekly") return amount * 4.33;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export function typeTotals(
  transactions: { type: TransactionType; amount: number }[],
): { income: number; expense: number; saved: number } {
  const totals = { income: 0, expense: 0, saved: 0 };
  for (const t of transactions) {
    if (t.type === "income") totals.income += t.amount;
    else if (t.type === "expense") totals.expense += t.amount;
    else if (t.type === "savings") totals.saved += t.amount;
  }
  return totals;
}

export function postedSet(monthTransactions: { name: string; amount: number; type: TransactionType }[]): Set<string> {
  return new Set(
    monthTransactions.map((t) => `${t.type}|${t.name.toLowerCase()}|${t.amount}`),
  );
}

export function unpostedRecurringForMonth(
  state: BudgetState,
  key: string,
): { income: number; expenses: number; count: number } {
  const posted = postedSet(state.data[key]?.transactions ?? []);
  let income = 0;
  let expenses = 0;
  let count = 0;
  for (const tpl of state.recurringTemplates) {
    if (tpl.frequency !== "monthly") continue;
    const sig = `${tpl.type}|${tpl.name.toLowerCase()}|${tpl.amount}`;
    if (posted.has(sig)) continue;
    if (tpl.type === "income") income += tpl.amount;
    else if (tpl.type === "expense") expenses += tpl.amount;
    else continue;
    count++;
  }
  return { income, expenses, count };
}

export function availableYears(state: BudgetState): number[] {
  const years = new Set<number>([state.currentYear]);
  for (const key of Object.keys(state.data)) {
    years.add(Number(key.split("-")[0]));
  }
  return [...years].sort((a, b) => b - a);
}

export function yearReview(state: BudgetState, year: number) {
  const byMonth: {
    month: number;
    income: number;
    expense: number;
    saved: number;
  }[] = [];
  let income = 0;
  let expense = 0;
  let saved = 0;
  const catMap: Record<string, number> = {};

  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    const month = state.data[key];
    const txs = month?.transactions ?? [];
    const totals = typeTotals(txs);
    byMonth.push({ month: m, ...totals });
    income += totals.income;
    expense += totals.expense;
    saved += totals.saved;
    for (const t of txs) {
      if (t.type !== "expense") continue;
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    }
  }

  const activeMonths = byMonth.filter((m) => m.income || m.expense || m.saved);
  const best = [...activeMonths].sort(
    (a, b) =>
      b.income - b.expense - b.saved - (a.income - a.expense - a.saved),
  )[0];
  const worst = [...activeMonths].sort(
    (a, b) =>
      a.income - a.expense - a.saved - (b.income - b.expense - b.saved),
  )[0];
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    income,
    expense,
    saved,
    balance: income - expense - saved,
    monthsWithActivity: activeMonths.length,
    best,
    worst,
    topCategories,
    byMonth,
  };
}

export function categoryAverageBefore(
  state: BudgetState,
  category: string,
  currentKey: string,
  lookBack = 3,
): number | null {
  const keys = lastMonthKeys(currentKey, lookBack + 1).slice(0, lookBack);
  const values = keys.map((key) =>
    (state.data[key]?.transactions ?? [])
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((s, t) => s + t.amount, 0),
  );
  if (values.every((v) => v === 0)) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
