import { DEFAULT_ACCENT_COLOR, isValidHexColor } from "./accentColor";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  accentColor: "accent-color",
  sidebarCollapsed: "sidebar-collapsed",
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

export function getStoredSidebarCollapsed(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(KEYS.sidebarCollapsed) === "1";
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.sidebarCollapsed, collapsed ? "1" : "0");
}
