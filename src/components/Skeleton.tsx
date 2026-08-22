interface Props {
  className?: string;
}

export default function Skeleton({ className = "" }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/70 ${className}`}
    />
  );
}
