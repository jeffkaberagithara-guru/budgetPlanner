import { Link } from "react-router-dom";
import {
  EyeOff,
  HardDrive,
  Download,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Card from "../components/Card";

const sections = [
  {
    icon: EyeOff,
    iconColor:
      "bg-teal-50 dark:bg-teal-900/20 text-primary dark:text-primary-light",
    title: "What we collect — nothing",
    points: [
      "No account, no email, no sign-up",
      "No analytics, telemetry or crash reporting",
      "No advertising or tracking cookies",
      "No server ever receives your financial data",
    ],
  },
  {
    icon: HardDrive,
    iconColor: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400",
    title: "Where your data lives",
    points: [
      "All data is stored in this browser's local storage, on this device",
      "Nothing is uploaded anywhere — the app works fully offline",
      "Clearing browser data for this site deletes everything",
      "If you lose the device or the browser profile, the data goes with it — keep backups",
    ],
  },
  {
    icon: Download,
    iconColor:
      "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    title: "What can leave your device",
    points: [
      "Only exports you trigger yourself: CSV files, JSON backups and printable reports",
      "Exports go straight from the browser to your downloads folder — no intermediary",
      "Treat exported files as sensitive; they contain unencrypted financial data",
    ],
  },
  {
    icon: ShieldCheck,
    iconColor:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    title: "Third parties & security",
    points: [
      "No third-party services are involved in storing or processing your data",
      "The optional PIN lock uses a salted SHA-256 hash kept in your browser — a convenience guard against casual snooping, not encryption of your data",
      "Device-level security (OS password, disk encryption) is the real perimeter",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
          Privacy
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          The short version: we collect nothing.
        </p>
      </div>

      {sections.map(({ icon: Icon, iconColor, title, points }) => (
        <Card key={title} className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-icon ${iconColor}`}>
              <Icon size={18} />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <ul className="space-y-2.5">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
              >
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Link
        to="/settings"
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition group mb-4"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-gray-400" />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Manage your data
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Backups, app-lock and deletion live in Settings
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-gray-400 transition"
        />
      </Link>

      <p className="text-xs text-gray-300 dark:text-gray-600 leading-relaxed">
        This page describes BudgetBold as shipped today: a local-first app with
        no backend. If that ever changes — accounts, sync, hosted features —
        it will be an explicit opt-in described here first.
      </p>
    </div>
  );
}
