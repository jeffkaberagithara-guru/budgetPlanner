import { useRef, useState } from "react";
import { Database, Download, Upload, AlertTriangle } from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import { isValidBudgetState, migrate } from "../context/budget-schema";
import { downloadFile, readFileText } from "../utils/file";
import { isoDate } from "../utils/date";

export default function BackupRestore() {
  const { state, dispatch } = useBudget();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    data: ReturnType<typeof migrate>;
    months: number;
    transactions: number;
    fromVersion: number;
  } | null>(null);

  function handleExport() {
    try {
      const filename = `budgetbold-backup-v${state.version}-${isoDate(new Date())}.json`;
      downloadFile(
        filename,
        JSON.stringify(state, null, 2),
        "application/json",
      );
      push({ message: "Backup downloaded", tone: "success" });
    } catch {
      push({ message: "Could not create the backup", tone: "error" });
    }
  }

  async function handleFile(file: File) {
    try {
      if (file.size > 10 * 1024 * 1024) {
        push({ message: "That file is too large to be a BudgetBold backup", tone: "error" });
        return;
      }
      const text = await readFileText(file);
      const parsed: unknown = JSON.parse(text);
      if (!isValidBudgetState(parsed)) {
        push({ message: "Not a valid BudgetBold backup file", tone: "error" });
        return;
      }
      const restored = migrate(parsed);
      const months = Object.keys(restored.data).length;
      let count = 0;
      for (const m of Object.values(restored.data)) {
        count += m.transactions.length;
      }
      setPending({
        data: restored,
        months,
        transactions: count,
        fromVersion: (parsed as { version?: number }).version ?? 0,
      });
    } catch {
      push({ message: "Could not read that file — is it valid JSON?", tone: "error" });
    }
  }

  function confirmRestore() {
    if (!pending) return;
    dispatch({ type: "RESTORE_STATE", payload: pending.data });
    push({
      message: `Restored ${pending.transactions} transactions across ${pending.months} months`,
      tone: "success",
    });
    setPending(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function cancelRestore() {
    setPending(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
      >
        <div className="flex items-center gap-3">
          <Download size={16} className="text-gray-400" />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Export Backup
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Full JSON snapshot — everything you've tracked
            </p>
          </div>
        </div>
      </button>

      <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
        <div className="flex items-center gap-3">
          <Upload size={16} className="text-gray-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Restore Backup
            </p>
            {pending ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Found{" "}
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  {pending.transactions}
                </span>{" "}
                transactions in{" "}
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  {pending.months}
                </span>{" "}
                months
                {pending.fromVersion > 0 && pending.fromVersion < state.version &&
                  ` · upgraded from v${pending.fromVersion}`}
                . Replaces everything.
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Load a previously exported JSON backup
              </p>
            )}
          </div>
        </div>

        {pending ? (
          <div className="mt-3 flex items-start gap-2.5 p-3 rounded-card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                This permanently replaces your current data. Consider exporting
                a backup first.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmRestore}
                  className="px-3.5 py-1.5 rounded-button bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
                >
                  Replace Everything
                </button>
                <button
                  onClick={cancelRestore}
                  className="px-3.5 py-1.5 rounded-button border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="mt-3 flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer transition">
            <Database size={14} className="text-gray-400 mr-2" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              Choose backup file…
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
