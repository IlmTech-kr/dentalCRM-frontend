import type { SocialDisplayMode } from "@/src/types/social.types";

/**
 * Havolalar endi backendda (useClinicProfile) — bu yerda faqat "list yoki
 * circle" ko'rinish tanlovi qoladi, chunki backend kontraktida
 * displayMode maydoni yo'q (bkz. store/socials.store.ts izohi).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  displayMode: "socials-display-mode",
} as const;

export function getStoredSocialDisplayMode(): SocialDisplayMode {
  if (!isBrowser()) return "circle";
  return localStorage.getItem(KEYS.displayMode) === "list" ? "list" : "circle";
}

export function saveSocialDisplayMode(mode: SocialDisplayMode): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.displayMode, mode);
}
