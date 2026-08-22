import { format, parseISO } from "date-fns";

export function formatDate(iso: string, pattern = "MMM d"): string {
  return format(parseISO(iso), pattern);
}

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function defaultTransactionDate(
  year: number,
  month: number,
): string {
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month;
  return isCurrentMonth ? isoDate(now) : isoDate(new Date(year, month, 1));
}
