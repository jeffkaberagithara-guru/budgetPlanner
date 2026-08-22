import { ReactNode, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const REVEAL = 84;

interface Props {
  children: ReactNode;
  onDelete: () => void;
  label?: string;
  className?: string;
}

export default function SwipeableRow({
  children,
  onDelete,
  label,
  className = "",
}: Props) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const baseRef = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);
  const vertical = useRef(false);

  function applyOffset(value: number) {
    offsetRef.current = value;
    setOffset(value);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    baseRef.current = offsetRef.current;
    locked.current = false;
    vertical.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!start.current || vertical.current) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (!locked.current) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        vertical.current = true;
        return;
      }
      if (Math.abs(dx) < 10) return;
      locked.current = true;
      setDragging(true);
    }
    applyOffset(Math.max(-REVEAL - 24, Math.min(0, baseRef.current + dx)));
  }

  function onTouchEnd() {
    start.current = null;
    if (!locked.current) return;
    setDragging(false);
    applyOffset(offsetRef.current < -REVEAL / 2 ? -REVEAL : 0);
  }

  function handleDelete() {
    applyOffset(0);
    onDelete();
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <button
        onClick={handleDelete}
        tabIndex={offset === 0 ? -1 : 0}
        aria-label={label ?? "Delete"}
        aria-hidden={offset === 0}
        className="absolute inset-y-1 right-1 w-[76px] rounded-xl bg-rose-500 text-white flex flex-col items-center justify-center gap-1 active:bg-rose-600 transition-colors"
      >
        <Trash2 size={16} />
        <span className="text-[10px] font-bold">Delete</span>
      </button>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative bg-white dark:bg-surface-dark ${
          dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
