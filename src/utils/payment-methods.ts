import { Banknote, CreditCard, Landmark, Smartphone } from "lucide-react";
import { ElementType } from "react";
import { PaymentMethod } from "../types";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank Transfer" },
];

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: ElementType }
> = {
  cash: { label: "Cash", icon: Banknote },
  card: { label: "Card", icon: CreditCard },
  mobile: { label: "Mobile Money", icon: Smartphone },
  bank: { label: "Bank Transfer", icon: Landmark },
};

export function paymentMethodLabel(method?: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? "";
}
