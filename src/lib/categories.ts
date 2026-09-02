import {
  ArrowLeftRight,
  Banknote,
  Car,
  CreditCard,
  Film,
  HeartPulse,
  Home,
  Lightbulb,
  ShoppingBasket,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "income"
  | "groceries"
  | "dining"
  | "transport"
  | "utilities"
  | "entertainment"
  | "health"
  | "housing"
  | "loans"
  | "transfer"
  | "deposit"
  | "other";

export const CATEGORIES: Record<CategoryKey, { label: string; icon: LucideIcon }> = {
  income: { label: "Income", icon: Banknote },
  groceries: { label: "Groceries", icon: ShoppingBasket },
  dining: { label: "Dining", icon: UtensilsCrossed },
  transport: { label: "Transport", icon: Car },
  utilities: { label: "Utilities", icon: Lightbulb },
  entertainment: { label: "Entertainment", icon: Film },
  health: { label: "Health", icon: HeartPulse },
  housing: { label: "Housing", icon: Home },
  loans: { label: "Loans", icon: CreditCard },
  transfer: { label: "Transfer", icon: ArrowLeftRight },
  deposit: { label: "Deposit", icon: Wallet },
  other: { label: "Other", icon: Wallet },
};

export function category(key: string) {
  return CATEGORIES[key as CategoryKey] ?? CATEGORIES.other;
}

export const SPEND_CATEGORIES: CategoryKey[] = [
  "groceries",
  "dining",
  "transport",
  "utilities",
  "entertainment",
  "health",
  "housing",
  "loans",
  "other",
];
