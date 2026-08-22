export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";" || (ch === "\t" && !src.includes(","))) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const HEADER_HINTS: Record<string, string[]> = {
  date: ["date", "transaction date", "posted", "posting date", "value date"],
  description: [
    "description",
    "name",
    "details",
    "narration",
    "particulars",
    "payee",
    "merchant",
    "memo",
    "title",
    "transaction",
  ],
  amount: ["amount", "value", "withdrawal", "deposit", "credit", "debit", "txn amount", "paid"],
  type: ["type", "dr/cr", "direction", "credit/debit", "transaction type"],
  category: ["category", "bucket", "tag"],
  note: ["note", "notes", "comment", "reference", "remarks"],
};

export interface ColumnMapping {
  date: number;
  description: number;
  amount: number;
  type: number;
  category: number;
  note: number;
}

function findHeader(headers: string[], hints: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const hint of hints) {
    const exact = lower.indexOf(hint);
    if (exact !== -1) return exact;
    const partial = lower.findIndex((h) => h.includes(hint));
    if (partial !== -1) return partial;
  }
  return -1;
}

export function guessMapping(
  headers: string[],
): { mapping: ColumnMapping; guessed: boolean } {
  const fallback: ColumnMapping = {
    date: headers.length > 0 ? 0 : -1,
    description: headers.length > 1 ? 1 : -1,
    amount: headers.length > 2 ? 2 : -1,
    type: -1,
    category: -1,
    note: -1,
  };
  if (headers.length === 0) return { mapping: fallback, guessed: false };

  const mapping: ColumnMapping = {
    date: findHeader(headers, HEADER_HINTS.date),
    description: findHeader(headers, HEADER_HINTS.description),
    amount: findHeader(headers, HEADER_HINTS.amount),
    type: findHeader(headers, HEADER_HINTS.type),
    category: findHeader(headers, HEADER_HINTS.category),
    note: findHeader(headers, HEADER_HINTS.note),
  };

  if (mapping.date !== -1 && mapping.description !== -1 && mapping.amount !== -1) {
    return { mapping, guessed: true };
  }

  const used = new Set(
    [mapping.date, mapping.description, mapping.amount].filter((i) => i >= 0),
  );
  for (let i = 0; i < headers.length; i++) {
    if (mapping.date === -1 && !used.has(i)) {
      mapping.date = i;
      used.add(i);
      continue;
    }
    if (mapping.description === -1 && !used.has(i)) {
      mapping.description = i;
      used.add(i);
      continue;
    }
    if (mapping.amount === -1 && !used.has(i)) {
      mapping.amount = i;
      used.add(i);
    }
  }
  return { mapping, guessed: false };
}

export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw
    .trim()
    .replace(/["\s]/g, "")
    .replace(/[^\d.,\-()]/g, "");
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

export type DateParseMode = "auto" | "dmy" | "mdy";

export function parseDateToIso(raw: string, mode: DateParseMode): string | null {
  const s = raw.trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    if (mode === "mdy" || (mode === "auto" && a > 12)) {
      return buildIso(year, b, a);
    }
    return buildIso(year, a, b);
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return buildIso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }
  return null;
}

function buildIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function inferTransactionType(
  typeRaw: string | undefined,
  amount: number,
  signMeansDirection: boolean,
): "income" | "expense" {
  if (typeRaw) {
    const t = typeRaw.trim().toLowerCase();
    if (
      t.includes("credit") ||
      t.includes("income") ||
      t.includes("deposit") ||
      t === "cr" ||
      t === "in"
    ) {
      return "income";
    }
    if (
      t.includes("debit") ||
      t.includes("expense") ||
      t.includes("withdrawal") ||
      t === "dr" ||
      t === "out"
    ) {
      return "expense";
    }
  }
  if (signMeansDirection) return amount < 0 ? "expense" : "income";
  return "expense";
}
