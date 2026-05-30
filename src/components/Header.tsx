import { Search, Bell } from "lucide-react";
import ClearDataButton from "./ClearDataButton";

export default function Header() {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Search — hidden on small mobile */}
      <div className="hidden sm:flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 w-48 md:w-72">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-xs font-black">B</span>
        </div>
        <span className="font-black text-gray-900 text-sm">BudgetBold</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <ClearDataButton />
        </div>
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-xl hover:bg-gray-50 transition"
        >
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
        </button>
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs md:text-sm font-bold">
          B
        </div>
      </div>
    </header>
  );
}