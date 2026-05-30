import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  PiggyBank,
  BarChart2,
  Sparkles,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: List, label: "Transactions", to: "/transactions" },
  { icon: BarChart2, label: "Reports", to: "/reports" },
  { icon: PiggyBank, label: "Savings", to: "/savings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-56 h-screen bg-gray-900 flex-col py-6 px-3 gap-1 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <span className="text-white font-black text-base tracking-tight">
            BudgetBold
          </span>
          <p className="text-gray-500 text-xs">Smart Finance</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive
                  ? "bg-linear-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-900/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom card */}
      <div className="mx-1 p-4 rounded-2xl bg-linear-to-br from-violet-600/20 to-pink-500/20 border border-violet-500/20">
        <p className="text-xs font-semibold text-violet-300 mb-1">Pro Tip 💡</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Track every expense to get the most accurate monthly report.
        </p>
      </div>
    </aside>
  );
}