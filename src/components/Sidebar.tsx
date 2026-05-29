import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, PiggyBank, BarChart2 } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: List, label: "Transactions", to: "/transactions" },
  { icon: BarChart2, label: "Reports", to: "/reports" },
  { icon: PiggyBank, label: "Savings", to: "/savings" },
];

export default function Sidebar() {
  return (
    <aside className="w-20 lg:w-56 h-screen bg-gray-900 flex flex-col py-6 px-3 gap-2 fixed left-0 top-0">
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-pink-500 shrink-0" />
        <span className="hidden lg:block text-white font-bold text-lg tracking-tight">
          BudgetBold
        </span>
      </div>
      {navItems.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
            ${
              isActive
                ? "bg-linear-to-r from-violet-600 to-pink-500 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <Icon size={20} className="shrink-0" />
          <span className="hidden lg:block text-sm font-medium">{label}</span>
        </NavLink>
      ))}
    </aside>
  );
}