import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { getMonthData } from "../utils/budget";
import TransactionRow from "./TransactionRow";
import EmptyState from "./EmptyState";
import ShowMoreList from "./ShowMoreList";

export default function TransactionList() {
  const { state } = useBudget();
  const { transactions } = getMonthData(state);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No transactions yet"
        description="Add your first income or expense above"
      />
    );
  }

  return (
    <ShowMoreList
      items={sorted}
      pageSize={12}
      step={30}
      renderItem={(tx) => <TransactionRow key={tx.id} tx={tx} />}
    />
  );
}
