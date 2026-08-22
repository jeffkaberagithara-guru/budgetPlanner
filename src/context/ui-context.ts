import { createContext } from "react";
import { Transaction, TransactionType } from "../types";

export interface EditingTx {
  key: string;
  tx: Transaction;
}

interface UiContextType {
  quickAddOpen: boolean;
  quickAddType: TransactionType;
  editingTx: EditingTx | null;
  openQuickAdd: (type?: TransactionType) => void;
  openEditTransaction: (key: string, tx: Transaction) => void;
  closeQuickAdd: () => void;
}

const UiContext = createContext<UiContextType | null>(null);

export default UiContext;
