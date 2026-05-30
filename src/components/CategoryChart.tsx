import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useBudget, getMonthData } from '../context/BudgetContext'

const CAT_COLORS: Record<string, string> = {
  Housing: '#f43f5e',
  Food: '#fb923c',
  Transport: '#fbbf24',
  Health: '#ec4899',
  Entertainment: '#a78bfa',
  Shopping: '#818cf8',
  Utilities: '#38bdf8',
  Education: '#86efac',
  Other: '#94a3b8',
}

function formatK(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
  return `${value}`
}

export default function CategoryChart() {
  const { state } = useBudget()
  const { transactions } = getMonthData(state)

  const expenses = transactions.filter(t => t.type === 'expense')

  const catMap: Record<string, number> = {}
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  })

  const data = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No expenses yet — add some to see the breakdown.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(value: number) => ['KES ' + value.toLocaleString(), 'Spent']}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #f1f5f9',
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map(entry => (
            <Cell
              key={entry.name}
              fill={CAT_COLORS[entry.name] ?? '#a78bfa'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}