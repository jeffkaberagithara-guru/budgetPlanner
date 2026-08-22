import { useContext, useMemo } from "react";
import BudgetContext from "../context/budget-context";
import { formatMoney } from "../utils/currency";

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}

export function useFormat() {
  const { state } = useBudget();
  const { currency } = state;
  return useMemo(
    () => (amount: number) => formatMoney(amount, currency),
    [currency],
  );
}
