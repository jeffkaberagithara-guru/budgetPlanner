import { BudgetState, Category } from "../types";
import {
  categorySpent,
  getEffectiveLimit,
  getMonthTotals,
  monthKey,
} from "./budget";
import { formatMoney } from "./currency";
import { formatDate } from "./date";
import { goalSaved } from "./goals";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a202c; padding: 32px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 22px; letter-spacing: -0.5px; }
  .muted { color: #718096; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1a202c; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-weight: 900; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #0f766e; }
  .tiles { display: flex; gap: 10px; margin-bottom: 24px; }
  .tile { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .tile .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 4px; }
  .tile .value { font-size: 16px; font-weight: 800; }
  .income { color: #059669; } .expense { color: #e11d48; } .balance { color: #2563eb; }
  section { margin-bottom: 24px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .over { color: #e11d48; font-weight: 700; }
  .ok { color: #059669; }
  .bar-cell { min-width: 90px; }
  .bar { height: 6px; background: #edf2f7; border-radius: 3px; overflow: hidden; }
  .bar > div { height: 100%; background: #14b8a6; border-radius: 3px; }
  .bar > div.over { background: #f43f5e; }
  footer { margin-top: 28px; font-size: 10px; color: #a0aec0; text-align: center; }
  @media print { body { padding: 16px; } }
`;

export function printMonthlyReport(
  state: BudgetState,
  year: number,
  month: number,
): boolean {
  const key = monthKey(year, month);
  const data = state.data[key];
  const transactions = data?.transactions ?? [];
  const { income, expense, saved, balance } = getMonthTotals(data);
  const fmt = (n: number) => formatMoney(n, state.currency);

  const expenseCategories = [
    ...new Set<Category | "Transfer">([
      ...transactions.filter((t) => t.type === "expense").map((t) => t.category),
      ...(data?.budgetLimits.map((l) => l.category as Category) ?? []),
    ]),
  ];

  const budgetRows = expenseCategories
    .map((category) => {
      const spent = categorySpent(data ?? {
        transactions: [], savingsGoal: 0, budgetLimits: [],
      }, category as Category);
      const limit = getEffectiveLimit(state, key, category as Category);
      const pct = limit && limit > 0 ? Math.min(100, (spent / limit) * 100) : null;
      return `<tr>
        <td>${esc(category)}</td>
        <td class="num">${limit ? fmt(limit) : "—"}</td>
        <td class="num">${fmt(spent)}</td>
        <td class="num ${limit !== null && spent > limit ? "over" : "ok"}">${
          limit === null ? "" : spent > limit ? `over by ${fmt(spent - limit)}` : `${Math.round((spent / limit) * 100)}%`
        }</td>
        <td class="bar-cell"><div class="bar"><div class="${limit !== null && spent > limit ? "over" : ""}" style="width:${pct ?? 0}%"></div></div></td>
      </tr>`;
    })
    .join("");

  const goalRows = state.goals.length > 0
    ? state.goals
        .map((g) => {
          const savedAmt = Math.min(goalSaved(state, g.id), g.targetAmount);
          const pct = g.targetAmount > 0 ? (savedAmt / g.targetAmount) * 100 : 0;
          return `<tr>
            <td>${esc(g.name)}</td>
            <td class="num">${fmt(g.targetAmount)}</td>
            <td class="num">${fmt(savedAmt)}</td>
            <td class="num ok">${Math.round(pct)}%</td>
            <td class="bar-cell"><div class="bar"><div style="width:${Math.min(100, pct)}%"></div></div></td>
          </tr>`;
        })
        .join("")
    : "";

  const txRows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const sign =
        t.type === "income" ? "+" : t.type === "transfer" ? "→" : "−";
      const cls =
        t.type === "income" ? "ok" : t.type === "transfer" ? "muted" : "expense";
      return `<tr>
        <td>${formatDate(t.date, "MMM d")}</td>
        <td>${esc(t.name)}${t.recurring ? ' <span class="muted">↻</span>' : ""}</td>
        <td class="muted">${esc(t.category)}</td>
        <td class="num ${cls}">${sign}${fmt(t.amount)}</td>
      </tr>`;
    })
    .join("");

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const generated = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BudgetBold — ${esc(monthLabel)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">BudgetBold</div>
    <h1>Monthly Report — ${esc(monthLabel)}</h1>
  </div>
  <div class="muted" style="font-size:11px">Generated ${generated}</div>
</div>

<div class="tiles">
  <div class="tile"><div class="label">Income</div><div class="value income">${fmt(income)}</div></div>
  <div class="tile"><div class="label">Expenses</div><div class="value expense">${fmt(expense)}</div></div>
  <div class="tile"><div class="label">Saved</div><div class="value balance">${fmt(saved)}</div></div>
  <div class="tile"><div class="label">Balance</div><div class="value ${balance >= 0 ? "balance" : "expense"}">${fmt(balance)}</div></div>
</div>

${budgetRows ? `<section><h2>Budget vs Actual</h2><table>
<thead><tr><th>Category</th><th style="text-align:right">Limit</th><th style="text-align:right">Spent</th><th style="text-align:right">Status</th><th></th></tr></thead>
<tbody>${budgetRows}</tbody></table></section>` : ""}

${goalRows ? `<section><h2>Goals</h2><table>
<thead><tr><th>Goal</th><th style="text-align:right">Target</th><th style="text-align:right">Saved</th><th style="text-align:right">Progress</th><th></th></tr></thead>
<tbody>${goalRows}</tbody></table></section>` : ""}

<section><h2>Transactions (${transactions.length})</h2>${
    txRows
      ? `<table><thead><tr><th>Date</th><th>Name</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead><tbody>${txRows}</tbody></table>`
      : `<p class="muted" style="font-size:12px">No transactions this month.</p>`
  }</section>

<footer>Private by design — generated locally from your BudgetBold data.</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=860,height=940");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
