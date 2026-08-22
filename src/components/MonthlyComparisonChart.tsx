import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useBudget, useFormat } from "../hooks/useBudget";
import { useTheme } from "../hooks/useTheme";
import { format } from "date-fns";
import EmptyState from "./EmptyState";
import ChartErrorBoundary from "./ChartErrorBoundary";

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export default function MonthlyComparisonChart() {
  const { state } = useBudget();
  const fmt = useFormat();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#475569" : "#94a3b8";

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
      <div className="h-48 flex items-center justify-center">
        <EmptyState
          compact
          icon={BarChart3}
          title="No history yet"
          description="Add transactions across months to see comparisons"
        />
      </div>
    );
  }

  const summary = data
    .map(
      (d) => `${d.name}: income ${fmt(d.Income)}, expenses ${fmt(d.Expenses)}`,
    )
    .join("; ");

  return (
    <ChartErrorBoundary height={220}>
      <div>
        <p className="sr-only">Grouped bar chart: income versus expenses over the last {data.length} months. {summary}.</p>
        <div role="img" aria-label={`Income versus expenses over the last ${data.length} months`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="30%" barGap={4} accessibilityLayer>
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
                formatter={(value, name) => [
                  Number(value).toLocaleString(),
                  name,
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                  background: isDark ? "#0c1220" : "#fff",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  fontSize: 13,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12, color: axisColor }}
              />
              <Bar dataKey="Income" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
}
