import { darkenHex } from "./accentColor";

export function applyAccentColor(color: string): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary-blue", color);
  root.style.setProperty("--primary-blue-dark", darkenHex(color));
}
