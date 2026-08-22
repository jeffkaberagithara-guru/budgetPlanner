import { BudgetState, Goal } from "../types";

export function goalSaved(state: BudgetState, goalId: string): number {
  let total = 0;
  for (const month of Object.values(state.data)) {
    for (const t of month.transactions) {
      if (t.type === "savings" && t.goalId === goalId) total += t.amount;
    }
  }
  return total;
}

export function goalSavedThisMonth(
  state: BudgetState,
  key: string,
  goalId: string,
): number {
  return (state.data[key]?.transactions ?? [])
    .filter((t) => t.type === "savings" && t.goalId === goalId)
    .reduce((s, t) => s + t.amount, 0);
}

export function monthsUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(0, months);
}

export function requiredPerMonth(goal: Goal, saved: number): number | null {
  const months = monthsUntil(goal.targetDate);
  if (months === null) return null;
  return Math.max(0, Math.ceil((goal.targetAmount - saved) / Math.max(1, months)));
}

export function plannedAllocation(
  goal: Goal,
  monthlyIncome: number,
): number {
  if (goal.allocationMode === "fixed") return goal.allocationValue;
  if (goal.allocationMode === "percent")
    return Math.round((monthlyIncome * goal.allocationValue) / 100);
  return 0;
}

export interface Milestone {
  pct: number;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { pct: 25, label: "25% there" },
  { pct: 50, label: "Halfway" },
  { pct: 75, label: "75% there" },
  { pct: 100, label: "Goal reached!" },
];

export function crossedMilestone(
  before: number,
  after: number,
  targetAmount: number,
): Milestone | null {
  if (targetAmount <= 0) return null;
  const beforePct = (before / targetAmount) * 100;
  const afterPct = (after / targetAmount) * 100;
  let hit: Milestone | null = null;
  for (const m of MILESTONES) {
    if (beforePct < m.pct && afterPct >= m.pct) hit = m;
  }
  return hit;
}
