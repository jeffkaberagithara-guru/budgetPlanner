import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DemoBanner from "./DemoBanner";
import BottomNav from "./BottomNav";
import AddTransactionModal from "./AddTransactionModal";
import { useUI } from "../hooks/useUI";

export default function Layout({ children }: { children: ReactNode }) {
  const { quickAddOpen, quickAddType, editingTx, openQuickAdd, closeQuickAdd } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest("input, textarea, select")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openQuickAdd("expense");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        openQuickAdd("savings");
      } else if (e.key === "/") {
        e.preventDefault();
        navigate("/transactions");
        setTimeout(
          () =>
            document.querySelector<HTMLInputElement>("[data-search]")?.focus(),
          0,
        );
      } else if (e.key === "Escape") {
        closeQuickAdd();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openQuickAdd, closeQuickAdd, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        <Header />
        <DemoBanner />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
      <button
        onClick={() => openQuickAdd("expense")}
        aria-label="Add transaction"
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 p-4 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 transition-all active:scale-95"
      >
        <Plus size={22} />
      </button>
      <AddTransactionModal
        open={quickAddOpen}
        defaultType={quickAddType}
        editing={editingTx}
        onClose={closeQuickAdd}
      />
    </div>
  );
}
