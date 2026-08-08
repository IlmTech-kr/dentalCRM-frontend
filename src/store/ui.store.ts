"use client";

/**
 * Sahifa yuklanishida FOUC bo'lmasligi uchun accent rang layout.tsx'dagi
 * bloklovchi inline script orqali <html> ustida darhol qo'yiladi (bu store
 * ishga tushishidan oldin). hydrateFromStorage() shu holatni store bilan
 * sinxronlaydi — locale.store.ts'dagi patternga o'xshash.
 */

import { create } from "zustand";
import {
  DEFAULT_ACCENT_COLOR,
  ensureUsableAccent,
  isValidHexColor,
} from "@/src/lib/theme/accentColor";
import { getStoredAccentColor, saveAccentColor } from "@/src/lib/theme/storage";
import { applyAccentColor } from "@/src/lib/theme/applyAccentColor";

interface UiState {
  accentColor: string;
  isHydrated: boolean;

  setAccentColor: (color: string) => void;
  hydrateFromStorage: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  accentColor: DEFAULT_ACCENT_COLOR,
  isHydrated: false,

  // ensureUsableAccent — tanlangan rang oq/och bo'lsa, text-primary-blue
  // (oq fonlarda) va bg-primary-blue ustidagi oq matn ko'rinmay qolmasligi
  // uchun ishlatsa bo'ladigan darajaga tushiriladi. Store'dagi qiymat doim
  // shu "xavfsiz" rang — picker va localStorage ham aynan shuni ko'rsatadi.
  setAccentColor: (color) => {
    if (!isValidHexColor(color)) return;
    const safe = ensureUsableAccent(color);
    saveAccentColor(safe);
    applyAccentColor(safe);
    set({ accentColor: safe });
  },

  hydrateFromStorage: () => {
    const stored = getStoredAccentColor();
    const safe = ensureUsableAccent(stored);
    if (safe !== stored) saveAccentColor(safe);
    applyAccentColor(safe);
    set({ accentColor: safe, isHydrated: true });
  },
}));
