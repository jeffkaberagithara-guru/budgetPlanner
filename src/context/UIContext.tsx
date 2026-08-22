import { useCallback, useMemo, useState, ReactNode } from "react";
import UiContext, { EditingTx } from "./ui-context";
import { TransactionType } from "../types";

export function UiProvider({ children }: { children: ReactNode }) {
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean;
    type: TransactionType;
    editing: EditingTx | null;
  }>({ open: false, type: "expense", editing: null });

  const openQuickAdd = useCallback(
    (type: TransactionType = "expense") =>
      setQuickAdd({ open: true, type, editing: null }),
    [],
  );

  const openEditTransaction = useCallback(
    (key: string, tx: EditingTx["tx"]) =>
      setQuickAdd({ open: true, type: tx.type, editing: { key, tx } }),
    [],
  );

  const closeQuickAdd = useCallback(
    () => setQuickAdd((s) => ({ ...s, open: false })),
    [],
  );

  const value = useMemo(
    () => ({
      quickAddOpen: quickAdd.open,
      quickAddType: quickAdd.type,
      editingTx: quickAdd.editing,
      openQuickAdd,
      openEditTransaction,
      closeQuickAdd,
    }),
    [quickAdd, openQuickAdd, openEditTransaction, closeQuickAdd],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}
