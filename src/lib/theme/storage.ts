import { DEFAULT_ACCENT_COLOR, isValidHexColor } from "./accentColor";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  accentColor: "accent-color",
} as const;

export function getStoredAccentColor(): string {
  if (!isBrowser()) return DEFAULT_ACCENT_COLOR;
  const raw = localStorage.getItem(KEYS.accentColor);
  return raw && isValidHexColor(raw) ? raw : DEFAULT_ACCENT_COLOR;
}

export function saveAccentColor(color: string): void {
  if (!isBrowser()) return;
  if (!isValidHexColor(color)) return;
  localStorage.setItem(KEYS.accentColor, color);
}
