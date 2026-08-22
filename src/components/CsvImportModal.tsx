import { useMemo, useRef, useState } from "react";
import { FileUp, Check, X, ArrowRight, FileText } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import {
  ColumnMapping,
  DateParseMode,
  guessMapping,
  inferTransactionType,
  parseAmount,
  parseCsv,
  parseDateToIso,
} from "../utils/csv";
import { readFileText } from "../utils/file";
import { Transaction, Category } from "../types";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "../utils/categories";

const MAX_ROWS = 500;

const ALL_CATEGORIES: Category[] = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
];

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount" },
];

const OPTIONAL_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "type", label: "Type (credit/debit)" },
  { key: "category", label: "Category" },
  { key: "note", label: "Note" },
];

interface BuildResult {
  txs: Transaction[];
  invalid: number;
  duplicatesInFile: number;
  duplicatesExisting: number;
}

export default function CsvImportModal({
  open,
  onClose,
}: Props) {
  const { state, dispatch } = useBudget();
  const fmt = useFormat();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: 0,
    description: 1,
    amount: 2,
    type: -1,
    category: -1,
    note: -1,
  });
  const [guessed, setGuessed] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateParseMode>("auto");
  const [signMeansDirection, setSignMeansDirection] = useState(true);

  const headers = hasHeader && rows.length > 0 ? rows[0] : null;
  const bodyRows = useMemo(
    () => (hasHeader ? rows.slice(1) : rows),
    [rows, hasHeader],
  );

  async function handleFile(file: File) {
    try {
      if (file.size > 5 * 1024 * 1024) {
        push({ message: "CSV too large — keep imports under 5MB", tone: "error" });
        return;
      }
      const text = await readFileText(file);
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        push({ message: "No rows found in that CSV", tone: "error" });
        return;
      }
      setRows(parsed);
      const looksLikeHeader = parsed[0].some((c) =>
        c.trim().toLowerCase().match(/^[a-z]/) && Number.isNaN(parseFloat(c)),
      );
      setHasHeader(looksLikeHeader);
      const guess = guessMapping(parsed[0]);
      setMapping(guess.mapping);
      setGuessed(guess.guessed);
    } catch {
      push({ message: "Could not read that file", tone: "error" });
    }
  }

  const buildResult = useMemo<BuildResult>(() => {
    const empty = { txs: [], invalid: 0, duplicatesInFile: 0, duplicatesExisting: 0 };
    if (bodyRows.length === 0) return empty;
    if (mapping.date < 0 || mapping.description < 0 || mapping.amount < 0)
      return empty;

    const existingSigs = new Set<string>();
    for (const month of Object.values(state.data)) {
      for (const t of month.transactions) {
        existingSigs.add(`${t.type}|${t.name.toLowerCase()}|${t.amount}|${t.date}`);
      }
    }

    const seen = new Set<string>();
    const txs: Transaction[] = [];
    let invalid = 0;
    let duplicatesInFile = 0;
    let duplicatesExisting = 0;

    for (const raw of bodyRows.slice(0, MAX_ROWS)) {
      const cell = (i: number) => (i >= 0 && i < raw.length ? raw[i].trim() : "");
      const dateIso = parseDateToIso(cell(mapping.date), dateFormat);
      const description = cell(mapping.description).replace(/\s+/g, " ");
      const amount = Math.abs(parseAmount(cell(mapping.amount)) ?? 0);

      if (!dateIso || !description || !amount) {
        invalid++;
        continue;
      }
      const name = description.slice(0, 80);
      const type = inferTransactionType(
        cell(mapping.type) || undefined,
        parseAmount(cell(mapping.amount)) ?? 0,
        mapping.type < 0 ? signMeansDirection : false,
      );
      const sig = `${type}|${name.toLowerCase()}|${amount}|${dateIso}`;
      if (seen.has(sig)) {
        duplicatesInFile++;
        continue;
      }
      seen.add(sig);
      if (existingSigs.has(sig)) {
        duplicatesExisting++;
        continue;
      }

      const catRaw = cell(mapping.category);
      const category: Category =
        mapping.category >= 0 &&
        (ALL_CATEGORIES as string[]).includes(catRaw)
          ? (catRaw as Category)
          : "Other";

      txs.push({
        id: crypto.randomUUID(),
        name,
        amount,
        type,
        category,
        date: dateIso,
        note: mapping.note >= 0 ? cell(mapping.note).slice(0, 140) || undefined : undefined,
      });
    }
    return { txs, invalid, duplicatesInFile, duplicatesExisting };
  }, [bodyRows, mapping, dateFormat, signMeansDirection, state.data]);

  const previewRows = buildResult.txs.slice(0, 5);

  function commit() {
    if (buildResult.txs.length === 0) return;
    const months = new Set<string>();
    for (const tx of buildResult.txs) {
      months.add(tx.date.slice(0, 7));
      dispatch({ type: "ADD_TRANSACTION", payload: tx });
    }
    push({
      message: `Imported ${buildResult.txs.length} transactions across ${months.size} month${months.size !== 1 ? "s" : ""}`,
      tone: "success",
    });
    resetAndClose();
  }

  function resetAndClose() {
    setRows([]);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-surface-dark rounded-2xl shadow-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Import from CSV
          </h2>
          <button
            onClick={onClose}
            aria-label="Close import"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {rows.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer transition">
            <FileUp size={28} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Choose a CSV file…
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
              Bank statements or any spreadsheet export. Nothing leaves your
              device — parsing happens locally.
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>
        ) : (
          <>
            <label className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="accent-teal-600"
              />
              First row contains column names
              {guessed && (
                <span className="ml-auto text-primary dark:text-primary-light font-bold">
                  columns auto-detected
                </span>
              )}
            </label>

            <div className="space-y-3 mb-4">
              {REQUIRED_FIELDS.map(({ key, label }) => (
                <ColumnSelect
                  key={key}
                  label={`${label} *`}
                  headers={headers}
                  rows={rows}
                  value={mapping[key]}
                  onChange={(i) => setMapping((m) => ({ ...m, [key]: i }))}
                />
              ))}
              {OPTIONAL_FIELDS.map(({ key, label }) => (
                <ColumnSelect
                  key={key}
                  label={label}
                  headers={headers}
                  rows={rows}
                  value={mapping[key]}
                  allowNone
                  onChange={(i) => setMapping((m) => ({ ...m, [key]: i }))}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Date format
                </span>
                <select
                  value={dateFormat}
                  onChange={(e) =>
                    setDateFormat(e.target.value as DateParseMode)
                  }
                  className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="dmy">Day/Month/Year (25/12/2026)</option>
                  <option value="mdy">Month/Day/Year (12/25/2026)</option>
                </select>
              </label>
              {mapping.type < 0 && (
                <label className="block">
                  <span className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Amount direction
                  </span>
                  <select
                    value={signMeansDirection ? "sign" : "expense"}
                    onChange={(e) =>
                      setSignMeansDirection(e.target.value === "sign")
                    }
                    className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
                  >
                    <option value="sign">Sign decides (− = expense)</option>
                    <option value="expense">Everything is an expense</option>
                  </select>
                </label>
              )}
            </div>

            {bodyRows.length > MAX_ROWS && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-3">
                Only the first {MAX_ROWS} rows will be imported (file has{" "}
                {bodyRows.length}).
              </p>
            )}

            <div className="rounded-xl border border-gray-100 dark:border-gray-800/60 overflow-hidden mb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60">
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Date</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Name</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Type</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-t border-gray-50 dark:border-gray-800/60"
                    >
                      <td className="px-3 py-1.5 text-xs text-gray-500">{tx.date}</td>
                      <td className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-32 truncate">
                        {tx.name}
                      </td>
                      <td className={`px-3 py-1.5 text-xs font-bold ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                        {tx.type}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-black text-gray-800 dark:text-gray-100 text-right tabular-nums">
                        {fmt(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {buildResult.txs.length}
                </span>{" "}
                ready
                {buildResult.invalid > 0 && (
                  <> · {buildResult.invalid} unreadable</>
                )}
                {buildResult.duplicatesExisting > 0 && (
                  <> · {buildResult.duplicatesExisting} already tracked</>
                )}
                {buildResult.duplicatesInFile > 0 && (
                  <> · {buildResult.duplicatesInFile} duplicated in file</>
                )}
              </div>
              <Check size={15} className="text-emerald-500 shrink-0" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRows([]);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="flex-1 py-3 rounded-button border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1.5"
              >
                <FileText size={14} /> Different file
              </button>
              <button
                onClick={commit}
                disabled={buildResult.txs.length === 0}
                className="flex-1 py-3 rounded-button bg-primary hover:bg-primary-dark disabled:opacity-40 text-white text-sm font-bold transition flex items-center justify-center gap-1.5"
              >
                Import {buildResult.txs.length} <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function ColumnSelect({
  label,
  headers,
  rows,
  value,
  onChange,
  allowNone,
}: {
  label: string;
  headers: string[] | null;
  rows: string[][];
  value: number;
  onChange: (index: number) => void;
  allowNone?: boolean;
}) {
  const columnCount = Math.max(...rows.map((r) => r.length));
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-400 mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary transition text-gray-800 dark:text-gray-100"
      >
        {allowNone && <option value={-1}>Not in file</option>}
        {Array.from({ length: columnCount }, (_, i) => (
          <option key={i} value={i}>
            {headers?.[i]?.trim() || `Column ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}
