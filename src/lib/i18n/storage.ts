/**
 * File: src/lib/i18n/storage.ts
 *
 * Foydalanuvchi til tanlovi faqat client'da (localStorage) saqlanadi.
 * Server tomonida locale aniqlash yo'q — bu ilova auth ortida ishlaydi,
 * SEO/URL locale-routing shart emas.
 */

export type Locale = "uz" | "ru" | "en";

export const DEFAULT_LOCALE: Locale = "uz";
export const SUPPORTED_LOCALES: Locale[] = ["uz", "ru", "en"];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  locale: "locale",
} as const;

function isValidLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as string[]).includes(value)
  );
}

export function getStoredLocale(): Locale {
  if (!isBrowser()) return DEFAULT_LOCALE;
  const raw = localStorage.getItem(KEYS.locale);
  return isValidLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function saveLocale(locale: Locale): void {
  if (!isBrowser()) return;
  if (!isValidLocale(locale)) return;
  localStorage.setItem(KEYS.locale, locale);
}
