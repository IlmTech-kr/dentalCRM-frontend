"use client";

/**
 * Havolalar (links) endi backenddan keladi (useClinicProfile) — bu store
 * faqat "list yoki circle" ko'rinish tanlovini saqlaydi, chunki backend
 * kontraktida displayMode maydoni yo'q. DIQQAT: shu sababli bu tanlov
 * faqat SHU brauzerda ishlaydi — ommaviy /socials sahifasiga kiruvchi
 * haqiqiy tashrif buyuruvchiga ta'sir qilmaydi (bkz. social.types.ts).
 */

import { create } from "zustand";
import type { SocialDisplayMode } from "@/src/types/social.types";
import { getStoredSocialDisplayMode, saveSocialDisplayMode } from "@/src/lib/socials/storage";

interface SocialsState {
  displayMode: SocialDisplayMode;
  isHydrated: boolean;

  hydrateFromStorage: () => void;
  setDisplayMode: (mode: SocialDisplayMode) => void;
}

export const useSocialsStore = create<SocialsState>((set, get) => ({
  displayMode: "circle",
  isHydrated: false,

  hydrateFromStorage: () => {
    if (get().isHydrated) return;
    set({
      displayMode: getStoredSocialDisplayMode(),
      isHydrated: true,
    });
  },

  setDisplayMode: (mode) => {
    saveSocialDisplayMode(mode);
    set({ displayMode: mode });
  },
}));
