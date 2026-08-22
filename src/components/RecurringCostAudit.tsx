import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { monthlyEquivalent } from "../utils/insights";
import EmptyState from "./EmptyState";

export default function RecurringCostAudit() {
  const { state } = useBudget();
  const fmt = useFormat();

  const items = useMemo(
    () =>
      state.recurringTemplates
        .map((t) => ({ ...t, perMonth: monthlyEquivalent(t.amount, t.frequency) }))
        .sort((a, b) => b.perMonth - a.perMonth),
    [state.recurringTemplates],
  );

  const committed = items
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.perMonth, 0);
  const incoming = items
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.perMonth, 0);
  const saving = items
    .filter((t) => t.type === "savings")
    .reduce((s, t) => s + t.perMonth, 0);

  if (items.length === 0) {
    return (
      <div>
        <Header />
        <EmptyState
          compact
          icon={Repeat}
          title="No recurring items yet"
          description="Add templates for rent, salary or subscriptions to audit your fixed costs"
        />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        You've committed{" "}
        <span className="font-black text-rose-500 dark:text-rose-400">
          {fmt(committed)}
        </span>{" "}
        per month to recurring expenses
        {incoming > 0 && (
          <>
            {" "}
            against{" "}
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {fmt(incoming)}
            </span>{" "}
            of recurring income
          </>
        )}
        .
      </p>

      <div className="space-y-1.5">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 dark:border-gray-800/60 last:border-0"
          >
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                {t.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold shrink-0 uppercase">
                {t.frequency}
              </span>
            </div>
            <span
              className={`text-xs font-black shrink-0 tabular-nums ${
                t.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : t.type === "savings"
                    ? "text-primary dark:text-primary-light"
                    : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {fmt(t.perMonth)}/mo
            </span>
          </div>
        ))}
      </div>

      {saving > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Plus {fmt(saving)}/mo flowing into savings goals.
        </p>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
        Recurring Cost Audit
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        What your subscriptions and fixed bills cost per month
      </p>
    </div>
  );
}
