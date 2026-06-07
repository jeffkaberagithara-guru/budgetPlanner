import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useBudget } from "../context/BudgetContext";
import { useTheme } from "../context/ThemeContext";
import { format } from "date-fns";

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export default function MonthlyComparisonChart() {
  const { state } = useBudget();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#4b5563" : "#94a3b8";

  const data = Array.from({ length: 6 }, (_, i) => {
    let month = state.currentMonth - (5 - i);
    let year = state.currentYear;
    if (month < 0) {
      month += 12;
      year--;
    }
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthData = state.data[key] ?? { transactions: [], savingsGoal: 0 };
    const income = monthData.transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthData.transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return {
      name: format(new Date(year, month, 1), "MMM"),
      Income: income,
      Expenses: expense,
    };
  });

  const isEmpty = data.every((d) => d.Income === 0 && d.Expenses === 0);

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600 text-sm">
        Add transactions across months to see comparisons.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%" barGap={4}>
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
          formatter={(value: number, name: string) => [
            "KES " + value.toLocaleString(),
            name,
          ]}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${isDark ? "#374151" : "#f1f5f9"}`,
            background: isDark ? "#111827" : "#fff",
            color: isDark ? "#f9fafb" : "#111827",
            fontSize: 13,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12, color: axisColor }}
        />
        <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}