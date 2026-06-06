import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ClearDataButton from "../components/ClearDataButton";
import {
  User,
  Palette,
  Bell,
  Shield,
  Download,
  ChevronRight,
  Check,
} from "lucide-react";
import { exportToCSV } from "../utils/export";
import { useBudget } from "../context/BudgetContext";

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS", "ZAR"];

export default function Settings() {
  const { theme } = useTheme();
  const { state } = useBudget();
  const [name, setName] = useState("Budget User");
  const [email, setEmail] = useState("user@budgetbold.com");
  const [currency, setCurrency] = useState("KES");
  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [saved, setSaved] = useState(false);

  const allTransactions = Object.values(state.data).flatMap(
    (m) => m.transactions,
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600">
            <User size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-black shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {name}
            </p>
            <p className="text-xs text-gray-400">{email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400 transition"
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600">
            <Palette size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Appearance
          </h2>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Dark Mode
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Currently {theme === "dark" ? "on" : "off"}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="pt-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Currency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  currency === c
                    ? "bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                    : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
            <Bell size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>
        {[
          {
            label: "Spending alerts",
            sub: "Get notified when spending exceeds 80%",
            value: notifications,
            set: setNotifications,
          },
          {
            label: "Weekly report",
            sub: "Receive a summary every Monday",
            value: weeklyReport,
            set: setWeeklyReport,
          },
        ].map(({ label, sub, value, set }) => (
          <div
            key={label}
            className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <button
              onClick={() => set(!value)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${value ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* Data & Privacy */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <Shield size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Data & Privacy
          </h2>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => exportToCSV(allTransactions, "all-time")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-3">
              <Download size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Export All Data
                </p>
                <p className="text-xs text-gray-400">
                  {allTransactions.length} transactions as CSV
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-gray-400 transition"
            />
          </button>
          <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Local Storage Only
                </p>
                <p className="text-xs text-gray-400">
                  Your data never leaves your device
                </p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <ClearDataButton />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
          saved
            ? "bg-emerald-500 text-white"
            : "bg-linear-to-r from-violet-600 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
        }`}
      >
        {saved ? (
          <>
            <Check size={16} /> Saved!
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );
}
