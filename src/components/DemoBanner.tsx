import { useEffect, useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import { DEMO_EVENT, disableDemo, isDemoActive } from "../utils/demo";

export default function DemoBanner() {
  const [active, setActive] = useState(() => isDemoActive());
  const { dispatch } = useBudget();
  const { push } = useToast();

  useEffect(() => {
    function sync() {
      setActive(isDemoActive());
    }
    window.addEventListener(DEMO_EVENT, sync);
    return () => window.removeEventListener(DEMO_EVENT, sync);
  }, []);

  if (!active) return null;

  function exit() {
    disableDemo(dispatch);
    push({ message: "Sample data removed — your own data is back", tone: "info" });
  }

  return (
    <div className="bg-primary/10 dark:bg-primary/15 border-b border-primary/20 dark:border-primary/25">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-primary-light">
          <FlaskConical size={13} className="shrink-0" />
          You're viewing sample data — your own data stays safe and untouched.
        </p>
        <button
          onClick={exit}
          className="flex items-center gap-1 px-2.5 py-1 rounded-button bg-primary hover:bg-primary-dark text-white text-xs font-bold transition shrink-0"
        >
          <X size={12} /> Exit demo
        </button>
      </div>
    </div>
  );
}
