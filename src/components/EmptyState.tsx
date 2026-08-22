import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  compact = false,
}: Props) {
  const iconBox = compact ? "w-12 h-12" : "w-14 h-14";
  const iconSize = compact ? 20 : 24;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8" : "py-10"
      }`}
    >
      <div
        className={`${iconBox} rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3`}
      >
        <Icon size={iconSize} className="text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {description && (
        <p
          className={`text-xs text-gray-300 dark:text-gray-600 mt-1 ${
            compact ? "" : "max-w-xs"
          }`}
        >
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
