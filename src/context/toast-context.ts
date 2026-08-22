import { createContext, ReactNode } from "react";

export type ToastTone = "success" | "info" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  icon?: ReactNode;
}

interface ToastContextType {
  push: (toast: {
    message: string;
    tone?: ToastTone;
    action?: ToastAction;
    icon?: ReactNode;
  }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export default ToastContext;
