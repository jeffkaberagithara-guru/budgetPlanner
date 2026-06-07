import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useBudget, getMonthData } from "../context/BudgetContext";
import { useTheme } from "../context/ThemeContext";

const CAT_COLORS: Record<string, string> = {
  Housing: "#f43f5e",
  Food: "#fb923c",
  Transport: "#fbbf24",
  Health: "#ec4899",
  Entertainment: "#a78bfa",
  Shopping: "#818cf8",
  Utilities: "#38bdf8",
  Education: "#86efac",
  Other: "#94a3b8",
};

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export default function CategoryChart() {
  const { state } = useBudget();
  const { theme } = useTheme();
  const { transactions } = getMonthData(state);
  const isDark = theme === "dark";
  const axisColor = isDark ? "#4b5563" : "#94a3b8";
  const gridColor = isDark ? "#1f2937" : "#f1f5f9";

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
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600 text-sm">
        No expenses yet — add some to see the breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
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
          formatter={(value: number) => [
            "KES " + value.toLocaleString(),
            "Spent",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${isDark ? "#374151" : "#f1f5f9"}`,
            background: isDark ? "#111827" : "#fff",
            color: isDark ? "#f9fafb" : "#111827",
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={CAT_COLORS[entry.name] ?? "#a78bfa"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}