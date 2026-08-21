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
import {
  getStoredAccentColor,
  getStoredSidebarCollapsed,
  saveAccentColor,
  saveSidebarCollapsed,
} from "@/src/lib/theme/storage";
import { applyAccentColor } from "@/src/lib/theme/applyAccentColor";
import type { AccentType, AppearanceSettings, ThemeMode } from "@/src/types/settings.types";

interface UiState {
  accentColor: string;
  themeMode: ThemeMode;
  accentType: AccentType;
  resolvedTheme: "light" | "dark";
  sidebarCollapsed: boolean;
  aiDrawerOpen: boolean;
  isHydrated: boolean;

  setAccentColor: (color: string) => void;
  applyAppearance: (settings: AppearanceSettings) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setAiDrawerOpen: (open: boolean) => void;
  hydrateFromStorage: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  accentColor: DEFAULT_ACCENT_COLOR,
  themeMode: "LIGHT",
  accentType: "DEFAULT",
  resolvedTheme: "light",
  sidebarCollapsed: false,
  aiDrawerOpen: false,
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

  applyAppearance: (settings) => {
    const color = settings.effectiveAccentColor || DEFAULT_ACCENT_COLOR;
    const resolved = settings.mode === "SYSTEM"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : settings.mode.toLowerCase() as "light" | "dark";
    document.documentElement.dataset.theme = resolved;
    saveAccentColor(color);
    applyAccentColor(color);
    localStorage.setItem("dashboard-theme-mode", settings.mode);
    set({accentColor:color,themeMode:settings.mode,accentType:settings.accentType,resolvedTheme:resolved});
  },

  setSidebarCollapsed: (collapsed) => {
    saveSidebarCollapsed(collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebarCollapsed: () => {
    const next = !get().sidebarCollapsed;
    saveSidebarCollapsed(next);
    set({ sidebarCollapsed: next });
  },

  setAiDrawerOpen: (open) => set({ aiDrawerOpen: open }),

  hydrateFromStorage: () => {
    const stored = getStoredAccentColor();
    const safe = ensureUsableAccent(stored);
    if (safe !== stored) saveAccentColor(safe);
    applyAccentColor(safe);
    const cachedMode=(localStorage.getItem("dashboard-theme-mode")||"LIGHT") as ThemeMode;
    const resolved=cachedMode==="SYSTEM"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):cachedMode.toLowerCase() as "light"|"dark";
    document.documentElement.dataset.theme=resolved;
    set({
      accentColor: safe,
      themeMode: cachedMode,
      resolvedTheme: resolved,
      sidebarCollapsed: getStoredSidebarCollapsed(),
      isHydrated: true,
    });
  },
}));
