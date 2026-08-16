import type { SocialDisplayMode, SocialLink } from "@/src/types/social.types";

/**
 * Hozircha faqat frontend-test — backend keyin qo'shiladi. Shu sababli
 * havolalar faqat shu brauzerda saqlanadi (src/lib/theme/storage.ts dagi
 * kabi hand-rolled localStorage pattern).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  links: "socials-links",
  displayMode: "socials-display-mode",
} as const;

export function getStoredSocialLinks(): SocialLink[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.links);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSocialLinks(links: SocialLink[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.links, JSON.stringify(links));
}

export function getStoredSocialDisplayMode(): SocialDisplayMode {
  if (!isBrowser()) return "circle";
  return localStorage.getItem(KEYS.displayMode) === "list" ? "list" : "circle";
}

export function saveSocialDisplayMode(mode: SocialDisplayMode): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.displayMode, mode);
}
