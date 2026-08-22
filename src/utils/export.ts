import { Transaction, CurrencyCode } from "../types";

export function exportToCSV(
  transactions: Transaction[],
  month: string,
  currency: CurrencyCode = "KES",
  accountLabel?: (t: Transaction) => string,
) {
  const headers = [
    "Date",
    "Description",
    "Category",
    "Type",
    `Amount (${currency})`,
    "Method",
    "Account",
    "Note",
  ];
  const rows = transactions.map((t) => [
    t.date,
    t.name,
    t.category,
    t.type,
    t.amount.toString(),
    t.method ?? "",
    accountLabel ? accountLabel(t) : "",
    t.note ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
