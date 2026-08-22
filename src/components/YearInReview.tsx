import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { availableYears, yearReview } from "../utils/insights";
import EmptyState from "./EmptyState";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function YearInReview() {
  const { state } = useBudget();
  const fmt = useFormat();
  const years = useMemo(() => availableYears(state), [state]);
  const [year, setYear] = useState<number>(years[0]);

  const review = useMemo(() => yearReview(state, year), [state, year]);

  if (review.monthsWithActivity === 0) {
    return (
      <div>
        <Header years={years} year={year} setYear={setYear} />
        <EmptyState
          compact
          icon={CalendarRange}
          title={`No data for ${year}`}
          description="Log transactions during the year to unlock your review"
        />
      </div>
    );
  }

  return (
    <div>
      <Header years={years} year={year} setYear={setYear} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="Income" value={fmt(review.income)} tone="positive" />
        <Stat label="Expenses" value={fmt(review.expense)} tone="negative" />
        <Stat label="To Goals" value={fmt(review.saved)} tone="neutral" />
        <Stat
          label="Net"
          value={fmt(review.balance)}
          tone={review.balance >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Monthly net
        </p>
        {review.byMonth
          .filter((m) => m.income || m.expense || m.saved)
          .map((m) => {
            const net = m.income - m.expense - m.saved;
            const maxAbs = Math.max(
              ...review.byMonth.map((x) =>
                Math.abs(x.income - x.expense - x.saved),
              ),
              1,
            );
            return (
              <div key={m.month} className="flex items-center gap-2">
                <span className="w-8 text-xs text-gray-400 shrink-0">
                  {MONTH_NAMES[m.month - 1]}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 bottom-0 rounded-full ${
                      net >= 0 ? "bg-emerald-400 left-1/2" : "bg-rose-400 right-1/2"
                    }`}
                    style={{ width: `${(Math.abs(net) / maxAbs) * 50}%` }}
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />
                </div>
                <span
                  className={`w-20 text-xs font-bold text-right tabular-nums ${
                    net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500"
                  }`}
                >
                  {fmt(net)}
                </span>
              </div>
            );
          })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {review.best && (
          <MiniCard
            title="Strongest month"
            body={`${MONTH_NAMES[review.best.month - 1]} · net ${fmt(
              review.best.income - review.best.expense - review.best.saved,
            )}`}
          />
        )}
        {review.worst && (
          <MiniCard
            title="Toughest month"
            body={`${MONTH_NAMES[review.worst.month - 1]} · net ${fmt(
              review.worst.income - review.worst.expense - review.worst.saved,
            )}`}
          />
        )}
        {review.topCategories.length > 0 && (
          <MiniCard
            title="Where it went"
            body={review.topCategories
              .map(([cat, amt]) => `${cat}: ${fmt(amt)}`)
              .join(" · ")}
          />
        )}
        <MiniCard
          title="Active months"
          body={`${review.monthsWithActivity} of 12 with activity`}
        />
      </div>
    </div>
  );
}

function Header({
  years,
  year,
  setYear,
}: {
  years: number[];
  year: number;
  setYear: (y: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Year in Review
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          The full picture for a calendar year
        </p>
      </div>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              y === year
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800/60 px-3 py-2.5">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className={`text-sm font-black truncate ${
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
              ? "text-rose-500"
              : "text-primary dark:text-primary-light"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
        {body}
      </p>
    </div>
  );
}
