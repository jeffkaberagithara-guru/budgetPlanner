import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { STORAGE_KEY } from "../context/budget-schema";
import { LOCK_STORAGE_KEY } from "../utils/lock";
import { DEMO_ACTIVE_KEY, DEMO_DATA_KEY, isDemoActive } from "../utils/demo";

export default function ClearDataButton() {
  const { state } = useBudget();
  const [armed, setArmed] = useState(false);
  const demo = isDemoActive();

  const months = Object.keys(state.data).length;
  const transactions = Object.values(state.data).reduce(
    (sum, m) => sum + m.transactions.length,
    0,
  );

  function handleDelete() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOCK_STORAGE_KEY);
    localStorage.removeItem(DEMO_DATA_KEY);
    localStorage.removeItem(DEMO_ACTIVE_KEY);
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setArmed(true)}
        disabled={armed}
        className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold transition-all bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30"
      >
        <Trash2 size={15} />
        Clear All Data
      </button>

      {armed && (
        <div className="flex items-start gap-2.5 p-3 rounded-card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle
            size={15}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
              This permanently deletes{" "}
              <span className="font-bold">
                {transactions} transaction{transactions !== 1 ? "s" : ""}
              </span>{" "}
              across{" "}
              <span className="font-bold">
                {months} month{months !== 1 ? "s" : ""}
              </span>{" "}
              — plus budgets, goals, recurring templates and your app-lock PIN.
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mb-2">
              There is no undo. Consider exporting a backup first.
              {demo && " Sample-data mode is switched off too."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-button bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
              >
                Delete Everything
              </button>
              <button
                onClick={() => setArmed(false)}
                className="px-3.5 py-1.5 rounded-button border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
