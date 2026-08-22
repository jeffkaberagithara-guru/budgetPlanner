import { createContext } from "react";
import { BudgetState, BudgetAction } from "../types";

export interface BudgetContextType {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export default BudgetContext;
