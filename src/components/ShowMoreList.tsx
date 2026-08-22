import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props<T> {
  items: T[];
  pageSize?: number;
  step?: number;
  renderItem: (item: T) => ReactNode;
}

export default function ShowMoreList<T>({
  items,
  pageSize = 30,
  step = 50,
  renderItem,
}: Props<T>) {
  const [count, setCount] = useState(pageSize);
  const [lastItems, setLastItems] = useState(items);

  if (lastItems !== items) {
    setLastItems(items);
    setCount(pageSize);
  }

  const visible = items.slice(0, count);
  const remaining = items.length - visible.length;

  return (
    <div>
      {visible.map((item) => renderItem(item))}

      {remaining > 0 && (
        <>
          <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 mt-3">
            Showing {visible.length} of {items.length}
          </p>
          <button
            onClick={() => setCount((c) => c + step)}
            className="mt-2 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-button border border-gray-100 dark:border-gray-800/60 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <ChevronDown size={13} />
            Show {Math.min(step, remaining)} more
          </button>
        </>
      )}
    </div>
  );
}
