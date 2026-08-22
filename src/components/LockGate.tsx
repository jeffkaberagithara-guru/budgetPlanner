import { ReactNode, useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import PinEntry from "./PinEntry";
import { LOCK_EVENT, loadLockRecord, verifyPin } from "../utils/lock";

export default function LockGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(() => loadLockRecord() !== null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryKey, setEntryKey] = useState(0);

  useEffect(() => {
    function lock() {
      setError(null);
      setEntryKey(0);
      setLocked(true);
    }
    window.addEventListener(LOCK_EVENT, lock);
    return () => window.removeEventListener(LOCK_EVENT, lock);
  }, []);

  async function handleComplete(pin: string) {
    const record = loadLockRecord();
    if (!record) {
      setLocked(false);
      return;
    }
    setChecking(true);
    let ok = false;
    let failureMessage = "Incorrect PIN — try again";
    try {
      ok = await verifyPin(pin, record);
    } catch {
      failureMessage = "Could not verify in this browser";
    }
    setChecking(false);
    if (ok) {
      setError(null);
      setLocked(false);
    } else {
      setError(failureMessage);
      setEntryKey((k) => k + 1);
    }
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-icon bg-primary flex items-center justify-center shrink-0">
            <Landmark size={20} className="text-white" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">
            BudgetBold
          </span>
        </div>

        <div className="bg-surface-dark-alt rounded-3xl p-8 border border-gray-800">
          <PinEntry
            key={entryKey}
            shake={entryKey > 0}
            title="Enter your PIN"
            subtitle={
              checking ? "Checking…" : "Unlock to access your budget data"
            }
            error={error}
            disabled={checking}
            onComplete={(pin) => void handleComplete(pin)}
          />
        </div>

        <p className="mt-5 text-[10px] text-gray-600 text-center leading-relaxed">
          Your PIN is verified on this device only. It never leaves your
          browser.
        </p>
      </div>
    </div>
  );
}
