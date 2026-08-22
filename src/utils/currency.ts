import { CurrencyCode } from "../types";

export type { CurrencyCode };

export const CURRENCIES: CurrencyCode[] = [
  "KES",
  "USD",
  "EUR",
  "GBP",
  "UGX",
  "TZS",
  "ZAR",
];

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  KES: "en-KE",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  UGX: "en-UG",
  TZS: "sw-TZ",
  ZAR: "en-ZA",
};

const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();

function getFormatter(code: CurrencyCode): Intl.NumberFormat {
  let formatter = formatterCache.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCY_LOCALES[code] ?? "en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    });
    formatterCache.set(code, formatter);
  }
  return formatter;
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCIES.includes(value as CurrencyCode);
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  return getFormatter(code).format(Math.round(amount));
}
