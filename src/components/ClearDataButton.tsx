import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function ClearDataButton() {
  const [confirm, setConfirm] = useState(false);

  function handleClear() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    localStorage.removeItem("budgetbold-data");
    window.location.reload();
  }

  return (
    <button
      onClick={handleClear}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        confirm
          ? "bg-rose-500 text-white animate-pulse"
          : "bg-rose-50 text-rose-500 hover:bg-rose-100"
      }`}
    >
      <Trash2 size={15} />
      {confirm ? "Click again to confirm" : "Clear All Data"}
    </button>
  );
}
