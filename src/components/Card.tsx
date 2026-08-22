import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export default function Card({
  children,
  className = "",
  padded = true,
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-surface-dark rounded-card shadow-card border border-gray-100 dark:border-gray-800/60 transition-colors ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
