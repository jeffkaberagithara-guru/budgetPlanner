export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Health",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Education",
  "Other",
] as const;

export const SAVINGS_CATEGORY = "Savings" as const;

const CATEGORY_HEX: Record<string, string> = {
  Salary: "#059669",
  Freelance: "#0d9488",
  Investment: "#0891b2",
  "Other Income": "#16a34a",
  Housing: "#e11d48",
  Food: "#ea580c",
  Transport: "#d97706",
  Health: "#db2777",
  Entertainment: "#7c3aed",
  Shopping: "#4f46e5",
  Utilities: "#2563eb",
  Education: "#65a30d",
  Savings: "#0f766e",
  Other: "#64748b",
  Transfer: "#0369a1",
};

export const CATEGORY_DOT: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_HEX).map(([k, v]) => [k, `bg-[${v}]`]),
);

export const CATEGORY_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_HEX).map(([k, v]) => [
    k,
    `bg-[${v}]/10 text-[${v}] dark:bg-[${v}]/20`,
  ]),
);

export const CATEGORY_HEX_MAP = CATEGORY_HEX;
