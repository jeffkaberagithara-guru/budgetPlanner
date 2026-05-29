import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search transactions..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-xl hover:bg-gray-50 transition"
        >
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
          B
        </div>
      </div>
    </header>
  );
}