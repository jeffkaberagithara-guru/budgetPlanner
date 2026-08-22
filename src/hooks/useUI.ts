import { useContext } from "react";
import UiContext from "../context/ui-context";

export function useUI() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUI must be used within UiProvider");
  return ctx;
}
