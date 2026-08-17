"use client";

/**
 * window.confirm() o'rniga — Usetoaststore.ts bilan bir xil pattern:
 * global zustand store + hostda bitta modal (ConfirmDialog, providers.tsx
 * ichida) + useConfirm() hook. Farqi — bu yerda Promise<boolean> qaytarish
 * kerak (foydalanuvchi javobini kutish uchun), shuning uchun `pending`
 * ichida `resolve` callback saqlanadi.
 */

import { create } from "zustand";

export type ConfirmTone = "danger" | "primary";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface PendingConfirm {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
  resolve: (value: boolean) => void;
}

interface ConfirmStore {
  pending: PendingConfirm | null;
  request: (
    options: ConfirmOptions & { confirmLabel: string; cancelLabel: string }
  ) => Promise<boolean>;
  resolve: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  pending: null,

  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        pending: {
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          tone: options.tone ?? "danger",
          resolve,
        },
      });
    }),

  resolve: (value) => {
    const pending = get().pending;
    if (!pending) return;
    pending.resolve(value);
    set({ pending: null });
  },
}));
