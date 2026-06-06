import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  BarChart2,
  PiggyBank,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", to: "/" },
  { icon: List, label: "Transactions", to: "/transactions" },
  { icon: BarChart2, label: "Reports", to: "/reports" },
  { icon: PiggyBank, label: "Savings", to: "/savings" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-1 py-2 transition-colors">
      {navItems.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive
                ? "text-violet-600 dark:text-violet-400"
                : "text-gray-400 dark:text-gray-500"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-violet-50 dark:bg-violet-900/30" : ""}`}
              >
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}