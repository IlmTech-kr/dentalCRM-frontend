"use client";

/**
 * File: src/store/locale.store.ts
 *
 * isHydrated faqat hydrateFromStorage() chaqirilganda true bo'ladi
 * (auth.store.ts'dagi kabi module-init'da emas) — Providers butun
 * komponent daraxtini shu flag orqali bloklaydi, chunki useTranslations()
 * chaqirilishidan oldin to'g'ri locale localStorage'dan o'qilgan bo'lishi shart.
 */

import { create } from "zustand";
import {
  getStoredLocale,
  saveLocale,
  DEFAULT_LOCALE,
  type Locale,
} from "@/src/lib/i18n/storage";

interface LocaleState {
  locale: Locale;
  isHydrated: boolean;

  setLocale: (locale: Locale) => void;
  hydrateFromStorage: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  isHydrated: false,

  setLocale: (locale) => {
    saveLocale(locale);
    set({ locale, isHydrated: true });
  },

  hydrateFromStorage: () => {
    const locale = getStoredLocale();
    set({ locale, isHydrated: true });
  },
}));
