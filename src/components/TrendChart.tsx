import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Activity } from "lucide-react";
import { format } from "date-fns";
import { useBudget, useFormat } from "../hooks/useBudget";
import { useTheme } from "../hooks/useTheme";
import { monthKey, getMonthTotals } from "../utils/budget";
import { lastMonthKeys } from "../utils/insights";
import EmptyState from "./EmptyState";
import ChartErrorBoundary from "./ChartErrorBoundary";

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export default function TrendChart() {
  const { state } = useBudget();
  const fmt = useFormat();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#475569" : "#94a3b8";

  const currentKey = monthKey(state.currentYear, state.currentMonth);
  const keys = lastMonthKeys(currentKey, 6);

  const data = keys.map((key) => {
    const totals = getMonthTotals(state.data[key]);
    const [y, m] = key.split("-").map(Number);
    return {
      name: format(new Date(y, m - 1, 1), "MMM"),
      Expenses: totals.expense,
    };
  });

  const active = data.filter((d) => d.Expenses > 0);
  if (active.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center">
        <EmptyState
          compact
          icon={Activity}
          title="Not enough history"
          description="Track expenses across at least two months to see your trend"
        />
      </div>
    );
  }

  const avg =
    active.reduce((s, d) => s + d.Expenses, 0) / active.length;

  const summary = `${data
    .map((d) => `${d.name}: ${fmt(d.Expenses)}`)
    .join(", ")}. Average: ${fmt(avg)} per month.`;

  return (
    <ChartErrorBoundary height={200}>
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Spending Trend
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Dashed line = your average monthly spend over this window
          </p>
        </div>
        <p className="sr-only">
          Area chart: expenses over the last {data.length} months. {summary}
        </p>
        <div role="img" aria-label={`Spending trend over ${data.length} months, averaging ${avg.toFixed(0)} per month`}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }} accessibilityLayer>
              <defs>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString(), "Expenses"]}
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                  background: isDark ? "#0c1220" : "#fff",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  fontSize: 13,
                }}
              />
              <ReferenceLine
                y={avg}
                stroke={isDark ? "#64748b" : "#94a3b8"}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#expenseFill)"
                dot={{ r: 3, fill: "#f43f5e", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
}
