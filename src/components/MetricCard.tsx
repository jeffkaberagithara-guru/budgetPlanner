import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  color: "green" | "red" | "blue" | "violet";
  sub?: string;
}

const colorMap = {
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
};

const valueColorMap = {
  green: "text-emerald-600",
  red: "text-rose-600",
  blue: "text-blue-600",
  violet: "text-violet-600",
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold truncate ${valueColorMap[color]}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}