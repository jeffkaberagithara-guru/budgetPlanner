import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import ToastContext, { ToastData, ToastTone } from "./toast-context";

const toneStyles: Record<ToastTone, { icon: typeof Info; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-500" },
  info: { icon: Info, iconClass: "text-primary dark:text-primary-light" },
  error: { icon: AlertTriangle, iconClass: "text-rose-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({
      message,
      tone = "info",
      action,
      icon,
    }: {
      message: string;
      tone?: ToastTone;
      action?: ToastData["action"];
      icon?: ReactNode;
    }) => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list.slice(-2), { id, message, tone, action, icon }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), action ? 7000 : 4500),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((toast) => {
          const { icon: ToneIcon, iconClass } = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="animate-toast-in pointer-events-auto w-full max-w-sm flex items-center gap-3 pl-4 pr-2 py-3 rounded-xl bg-white dark:bg-surface-dark-alt border border-gray-100 dark:border-gray-800 shadow-modal"
            >
              {toast.icon ? (
                <span
                  className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${
                    toast.tone === "success"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                      : toast.tone === "error"
                        ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500"
                        : "bg-teal-50 dark:bg-teal-900/30 text-primary dark:text-primary-light"
                  }`}
                >
                  {toast.icon}
                </span>
              ) : (
                <ToneIcon size={17} className={`${iconClass} shrink-0`} />
              )}
              <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                {toast.message}
              </p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide text-primary dark:text-primary-light hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
