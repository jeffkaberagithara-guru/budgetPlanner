import { useEffect, useRef, useState } from "react";

interface Props {
  income: number;
  expense: number;
}

export default function SpendingBar({ income, expense }: Props) {
  const pct =
    income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = () => {
            start += 2;
            setAnimatedPct(Math.min(start, pct));
            if (start < pct) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct]);

  const color =
    pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-400" : "bg-emerald-500";

  const message =
    pct > 90
      ? "Danger! You've used over 90% of your income."
      : pct > 70
        ? `Caution — you've spent ${pct}% of your income.`
        : pct > 0
          ? `You've used ${pct}% of your income. Looking good!`
          : "No transactions yet this month.";

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">
          Spending vs Income
        </p>
        <span className="text-sm font-bold text-gray-900">{animatedPct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${animatedPct}%`, transition: "width 0.05s linear" }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{message}</p>
    </div>
  );
}