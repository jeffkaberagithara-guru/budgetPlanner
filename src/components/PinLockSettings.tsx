import { useState } from "react";
import { Lock, LockKeyhole } from "lucide-react";
import Card from "./Card";
import PinEntry from "./PinEntry";
import { useToast } from "../hooks/useToast";
import {
  LOCK_EVENT,
  clearLock,
  createLockRecord,
  loadLockRecord,
  saveLockRecord,
  verifyPin,
} from "../utils/lock";

type Flow =
  | { mode: "setup"; step: "choose" | "confirm"; first: string }
  | { mode: "disable" }
  | null;

export default function PinLockSettings() {
  const { push } = useToast();
  const [enabled, setEnabled] = useState(() => loadLockRecord() !== null);
  const [flow, setFlow] = useState<Flow>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);

  function fail(message: string) {
    setFlowError(message);
    setAttempts((a) => a + 1);
    setBusy(false);
  }

  function closeFlow() {
    setFlow(null);
    setFlowError(null);
    setAttempts(0);
    setBusy(false);
  }

  function openSetup() {
    setFlow({ mode: "setup", step: "choose", first: "" });
    setFlowError(null);
    setAttempts(0);
  }

  async function handleComplete(pin: string) {
    if (!flow) return;

    if (flow.mode === "disable") {
      const record = loadLockRecord();
      if (!record) {
        closeFlow();
        return;
      }
      setBusy(true);
      let ok = false;
      let failureMessage = "Incorrect PIN";
      try {
        ok = await verifyPin(pin, record);
      } catch {
        failureMessage = "Verification failed in this browser";
      }
      if (!ok) {
        fail(failureMessage);
        return;
      }
      clearLock();
      setEnabled(false);
      push({ message: "PIN lock removed", tone: "info" });
      closeFlow();
      return;
    }

    if (flow.step === "choose") {
      setFlow({ mode: "setup", step: "confirm", first: pin });
      setFlowError(null);
      setAttempts(0);
      return;
    }

    if (pin !== flow.first) {
      fail("PINs didn't match — start again");
      setFlow({ mode: "setup", step: "choose", first: "" });
      return;
    }

    setBusy(true);
    try {
      saveLockRecord(await createLockRecord(pin));
    } catch {
      fail("Couldn't set up PIN in this browser");
      return;
    }
    setEnabled(true);
    push({ message: "PIN lock enabled", tone: "success" });
    closeFlow();
  }

  function lockNow() {
    window.dispatchEvent(new Event(LOCK_EVENT));
  }

  const entryKey = flow
    ? `${flow.mode}:${flow.mode === "setup" ? flow.step : "-"}:${attempts}`
    : "";

  const modalCopy = !flow
    ? null
    : flow.mode === "disable"
      ? {
          title: "Enter your current PIN",
          subtitle: busy ? "Checking…" : "Confirm it's you turning the lock off",
        }
      : flow.step === "confirm"
        ? {
            title: "Confirm your PIN",
            subtitle: "Re-enter the same 4 digits",
          }
        : {
            title: "Create your PIN",
            subtitle: "4 digits — you'll type it once more to confirm",
          };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-icon bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
          <LockKeyhole size={18} />
        </div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Security
        </h2>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/60">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            App lock
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Require a 4-digit PIN whenever BudgetBold opens
          </p>
        </div>
        <button
          onClick={() => (enabled ? setFlow({ mode: "disable" }) : openSetup())}
          aria-label={enabled ? "Turn off app lock" : "Turn on app lock"}
          disabled={busy}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${
            enabled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="pt-3 space-y-3">
          <button
            onClick={lockNow}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Lock now
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Hide your data until the PIN is entered
                </p>
              </div>
            </div>
          </button>
          <p className="text-[10px] text-gray-300 dark:text-gray-600 leading-relaxed">
            Your PIN is stored as a salted SHA-256 hash in this browser only.
            It guards against casual snooping — not someone who controls this
            device.
          </p>
        </div>
      )}

      {flow && modalCopy && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) closeFlow();
          }}
        >
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-modal w-full max-w-xs p-6">
            <PinEntry
              key={entryKey}
              shake={attempts > 0}
              title={modalCopy.title}
              subtitle={modalCopy.subtitle}
              error={flowError}
              disabled={busy}
              onComplete={(pin) => void handleComplete(pin)}
              onCancel={() => {
                if (!busy) closeFlow();
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
