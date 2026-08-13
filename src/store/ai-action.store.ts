"use client";

import { create } from "zustand";
import type { AiPendingAction } from "@/src/types/ai.types";

interface AiActionState {
  activeAction: AiPendingAction | null;
  updates: Record<string, AiPendingAction>;
  openAction: (action: AiPendingAction) => void;
  closeAction: () => void;
  recordAction: (action: AiPendingAction) => void;
  replaceWithRedraft: (
    previous: AiPendingAction,
    replacement: AiPendingAction
  ) => void;
}

export const useAiActionStore = create<AiActionState>((set) => ({
  activeAction: null,
  updates: {},
  openAction: (action) =>
    set((state) => ({
      activeAction: state.updates[action.id] || action,
    })),
  closeAction: () => set({ activeAction: null }),
  recordAction: (action) =>
    set((state) => ({
      activeAction:
        state.activeAction?.id === action.id ? action : state.activeAction,
      updates: { ...state.updates, [action.id]: action },
    })),
  replaceWithRedraft: (previous, replacement) =>
    set((state) => ({
      activeAction: replacement,
      updates: {
        ...state.updates,
        [previous.id]: {
          ...previous,
          status: "SUPERSEDED",
          supersededByActionId: replacement.id,
        },
        [replacement.id]: replacement,
      },
    })),
}));
