import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, BarChart2, PiggyBank } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", to: "/" },
  { icon: List, label: "Transactions", to: "/transactions" },
  { icon: BarChart2, label: "Reports", to: "/reports" },
  { icon: PiggyBank, label: "Savings", to: "/savings" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
      {navItems.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              isActive ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-violet-50" : ""}`}
              >
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}