import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PieChart } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { getMonthData } from "../utils/budget";
import { useTheme } from "../hooks/useTheme";
import { CATEGORY_HEX_MAP } from "../utils/categories";
import EmptyState from "./EmptyState";
import ChartErrorBoundary from "./ChartErrorBoundary";

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export default function CategoryChart() {
  const { state } = useBudget();
  const fmt = useFormat();
  const { theme } = useTheme();
  const { transactions } = getMonthData(state);
  const isDark = theme === "dark";
  const axisColor = isDark ? "#475569" : "#94a3b8";

  const catMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    });

  const data = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <EmptyState
          compact
          icon={PieChart}
          title="No expenses yet"
          description="Add some to see the breakdown"
        />
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const summary = data
    .slice(0, 5)
    .map(
      ({ name, value }) =>
        `${name}: ${fmt(value)} (${Math.round((value / total) * 100)}%)`,
    )
    .join(", ");

  return (
    <ChartErrorBoundary height={220}>
      <div>
        <p className="sr-only">
          Bar chart: spending by category this month. {summary}.
        </p>
        <div role="img" aria-label="Spending by category bar chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="30%" accessibilityLayer>
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
                width={36}
              />
              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Spent",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                  background: isDark ? "#0c1220" : "#fff",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_HEX_MAP[entry.name] ?? "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
}
