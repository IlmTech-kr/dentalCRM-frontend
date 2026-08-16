"use client";

import { create } from "zustand";
import type { SocialDisplayMode, SocialLink, SocialPlatform } from "@/src/types/social.types";
import {
  getStoredSocialDisplayMode,
  getStoredSocialLinks,
  saveSocialDisplayMode,
  saveSocialLinks,
} from "@/src/lib/socials/storage";

interface SocialsState {
  links: SocialLink[];
  displayMode: SocialDisplayMode;
  isHydrated: boolean;

  hydrateFromStorage: () => void;
  addLink: (platform: SocialPlatform, url: string, label?: string) => void;
  updateLink: (id: string, patch: Partial<Omit<SocialLink, "id">>) => void;
  removeLink: (id: string) => void;
  reorderLinks: (links: SocialLink[]) => void;
  setDisplayMode: (mode: SocialDisplayMode) => void;
}

export const useSocialsStore = create<SocialsState>((set, get) => ({
  links: [],
  displayMode: "circle",
  isHydrated: false,

  hydrateFromStorage: () => {
    if (get().isHydrated) return;
    set({
      links: getStoredSocialLinks(),
      displayMode: getStoredSocialDisplayMode(),
      isHydrated: true,
    });
  },

  addLink: (platform, url, label) => {
    const link: SocialLink = {
      id: crypto.randomUUID(),
      platform,
      url: url.trim(),
      label: label?.trim() || undefined,
    };
    const next = [...get().links, link];
    saveSocialLinks(next);
    set({ links: next });
  },

  updateLink: (id, patch) => {
    const next = get().links.map((link) => (link.id === id ? { ...link, ...patch } : link));
    saveSocialLinks(next);
    set({ links: next });
  },

  removeLink: (id) => {
    const next = get().links.filter((link) => link.id !== id);
    saveSocialLinks(next);
    set({ links: next });
  },

  reorderLinks: (links) => {
    saveSocialLinks(links);
    set({ links });
  },

  setDisplayMode: (mode) => {
    saveSocialDisplayMode(mode);
    set({ displayMode: mode });
  },
}));
