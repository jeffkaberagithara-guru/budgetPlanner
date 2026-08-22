import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { PIN_LENGTH } from "../utils/lock";

interface Props {
  title: string;
  subtitle?: string;
  error?: string | null;
  shake?: boolean;
  disabled?: boolean;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
}

export default function PinEntry({
  title,
  subtitle,
  error,
  shake = false,
  disabled = false,
  onComplete,
  onCancel,
}: Props) {
  const [digits, setDigits] = useState("");
  const busyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  function press(digit: string) {
    if (disabled || busyRef.current || digits.length >= PIN_LENGTH) return;
    const next = digits + digit;
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      busyRef.current = true;
      timerRef.current = window.setTimeout(() => {
        busyRef.current = false;
        onComplete(next);
      }, 160);
    }
  }

  function backspace() {
    if (disabled || busyRef.current || digits.length === 0) return;
    setDigits(digits.slice(0, -1));
  }

  function onKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("input, textarea, select")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      press(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-base font-black text-gray-900 dark:text-white text-center">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
          {subtitle}
        </p>
      )}

      <div
        role="status"
        aria-label={`PIN entry, ${digits.length} of ${PIN_LENGTH} digits entered`}
        className={`flex items-center gap-4 my-6 ${
          shake ? "animate-shake-x" : ""
        }`}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < digits.length
                ? "bg-primary scale-110"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      <p
        aria-live="polite"
        className="h-5 mb-2 text-xs font-semibold text-rose-500"
      >
        {error ?? ""}
      </p>

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k}
            className="py-3 rounded-button text-lg font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition"
          >
            {k}
          </button>
        ))}
        <div />
        <button
          onClick={() => press("0")}
          aria-label="0"
          className="py-3 rounded-button text-lg font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition"
        >
          0
        </button>
        <button
          onClick={backspace}
          aria-label="Delete last digit"
          disabled={digits.length === 0}
          className="py-3 rounded-button flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 active:scale-95 transition"
        >
          <Delete size={18} />
        </button>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
