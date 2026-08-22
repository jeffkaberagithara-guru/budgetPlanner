import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import ClearDataButton from "../components/ClearDataButton";
import BackupRestore from "../components/BackupRestore";
import PinLockSettings from "../components/PinLockSettings";
import AccountManager from "../components/AccountManager";
import Card from "../components/Card";
import {
  User,
  Palette,
  Bell,
  Shield,
  Download,
  ChevronRight,
  Check,
  Repeat,
  Layers,
  FlaskConical,
} from "lucide-react";
import { exportToCSV } from "../utils/export";
import { useBudget } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import { CURRENCIES, CurrencyCode, formatMoney } from "../utils/currency";
import { loadProfile, saveProfile } from "../utils/profile";
import { accountName } from "../utils/accounts";
import { Profile } from "../types";
import {
  DEMO_EVENT,
  disableDemo,
  enableDemo,
  isDemoActive,
} from "../utils/demo";

export default function Settings() {
  const { theme } = useTheme();
  const { state, dispatch } = useBudget();
  const { push } = useToast();
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [demoActive, setDemoActive] = useState(() => isDemoActive());
  const currency = state.currency;

  useEffect(() => {
    function sync() {
      setDemoActive(isDemoActive());
    }
    window.addEventListener(DEMO_EVENT, sync);
    return () => window.removeEventListener(DEMO_EVENT, sync);
  }, []);

  const allTransactions = Object.values(state.data).flatMap(
    (m) => m.transactions,
  );

  function updateProfile(patch: Partial<Profile>) {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }

  function handleCurrencyChange(c: CurrencyCode) {
    dispatch({ type: "SET_CURRENCY", payload: c });
  }

  function toggleDemo() {
    if (demoActive) {
      disableDemo(dispatch);
      push({ message: "Sample data removed — your own data is back", tone: "info" });
    } else {
      enableDemo(dispatch);
      push({ message: "Sample data loaded — explore freely, exit anytime", tone: "success" });
    }
  }

  function toggleSetting(
    key: "rollover" | "autoApplyRecurring" | "spendingAlerts",
    label: string,
    value: boolean,
  ) {
    dispatch({ type: "SET_SETTINGS", payload: { [key]: !value } });
    push({ message: `${label} ${!value ? "enabled" : "disabled"}`, tone: "success" });
  }

  const { rollover, autoApplyRecurring, spendingAlerts = true } = state.settings;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Manage your profile and preferences
        </p>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-icon bg-teal-50 dark:bg-teal-900/20 text-primary dark:text-primary-light">
            <User size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black shrink-0">
            {(profile.name.trim()[0] ?? "B").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {profile.name.trim() || "Budget User"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {profile.email.trim() || "Local profile — stored on this device only"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-input border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
        </div>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-4">
          Changes save automatically as you type — nothing is uploaded anywhere.
        </p>
      </Card>

      <AccountManager />

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-icon bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
            <Palette size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Appearance
          </h2>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/60">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Dark Mode
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Currently {theme === "dark" ? "on" : "off"}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="pt-3">
          <div className="flex items-baseline justify-between mb-3">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Currency
            </label>
            <span className="text-xs font-semibold text-primary dark:text-primary-light">
              e.g. {formatMoney(1234, currency)}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={`flex items-center justify-center gap-1 py-2 rounded-button text-xs font-bold transition-all border ${
                  currency === c
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-primary dark:text-primary-light"
                    : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                {currency === c && <Check size={12} />}
                {c}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">
            Applies everywhere instantly — existing amounts are re-labeled, not converted.
          </p>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-icon bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <Layers size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Budgeting
          </h2>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/60">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Rollover unused budget
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Unspent category limits carry into future months
            </p>
          </div>
          <button
            onClick={() => toggleSetting("rollover", "Rollover", rollover)}
            aria-label="Toggle budget rollover"
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${rollover ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${rollover ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between py-3 last:border-0">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              Auto-post recurring
              <Repeat size={12} className="text-teal-500" />
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Monthly templates appear automatically in new months
            </p>
          </div>
          <button
            onClick={() =>
              toggleSetting("autoApplyRecurring", "Auto-post recurring", autoApplyRecurring)
            }
            aria-label="Toggle auto-post recurring"
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${autoApplyRecurring ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${autoApplyRecurring ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-icon bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <Bell size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Spending alerts
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Warn you when spending passes 70% and 90% of income
            </p>
          </div>
          <button
            onClick={() => toggleSetting("spendingAlerts", "Spending alerts", spendingAlerts)}
            aria-label="Toggle spending alerts"
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${spendingAlerts ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${spendingAlerts ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </Card>

      <PinLockSettings />

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-icon bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Shield size={18} />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Data & Privacy
          </h2>
        </div>
        <div className="space-y-2">
          <button
            onClick={toggleDemo}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-3">
              <FlaskConical size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Sample Data
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {demoActive
                    ? "Active — exiting restores your own data"
                    : "Explore BudgetBold with generated example data"}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-button text-xs font-bold transition ${
                demoActive
                  ? "bg-primary hover:bg-primary-dark text-white"
                  : "border border-teal-300 dark:border-teal-700 text-primary dark:text-primary-light group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30"
              }`}
            >
              {demoActive ? "Exit Demo" : "Load Sample"}
            </span>
          </button>
          <Link
            to="/privacy"
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Privacy Policy
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  What we collect: nothing — local-first by design
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-gray-400 transition"
            />
          </Link>
          <button
            onClick={() => {
              exportToCSV(
                allTransactions,
                "all-time",
                currency,
                (t) => accountName(state, t.accountId),
              );
              push({
                message: `Exported ${allTransactions.length} transaction${allTransactions.length !== 1 ? "s" : ""}`,
                tone: "success",
              });
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-3">
              <Download size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Export All Data
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {allTransactions.length} transactions as CSV
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-gray-400 transition"
            />
          </button>
          <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Local Storage Only
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Your data never leaves your device
                </p>
              </div>
            </div>
          </div>
          <BackupRestore />
          <div className="pt-2">
            <ClearDataButton />
          </div>
        </div>
      </Card>
    </div>
  );
}
