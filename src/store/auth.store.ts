"use client";

/**
 * File: src/store/auth.store.ts
 *
 * accessToken localStorage'da saqlanmaydi.
 * Token backend tomonidan HttpOnly cookie sifatida boshqariladi.
 */

import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";
import { Role } from "../lib/enums/enums.types";
import {
  getStoredUser,
  saveUser,
  clearAuthStorage,
} from "@/src/lib/auth/storage";

type AuthDataPayload = {
  user?: AuthUser | null;
  isAuthenticated?: boolean;
};

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (value: boolean) => void;
  setAuthData: (data: AuthDataPayload) => void;
  hydrateFromStorage: () => void;
  logout: () => void;

  hasRole: (role: string) => boolean;
  getPrimaryRole: () => string | null;
  isAdmin: () => boolean;
  isClinicAdmin: () => boolean;
  isDoctor: () => boolean;
  isAssistant: () => boolean;
  isReceptionist: () => boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const initialUser = getStoredUser<AuthUser>();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  isHydrated: isBrowser(),

  setUser: (user) => {
    saveUser(user);
    set({ user, isAuthenticated: Boolean(user), isHydrated: true });
  },

  setAuthenticated: (value) => {
    set({ isAuthenticated: value, isHydrated: true });
  },

  setAuthData: (data) => {
    if (data.user !== undefined) {
      saveUser(data.user);
    }

    const nextUser = data.user !== undefined ? data.user : get().user;

    set({
      user: nextUser,
      isAuthenticated:
        data.isAuthenticated !== undefined
          ? data.isAuthenticated
          : Boolean(nextUser),
      isHydrated: true,
    });
  },

  hydrateFromStorage: () => {
    const user = getStoredUser<AuthUser>();
    set({ user, isAuthenticated: Boolean(user), isHydrated: true });
  },

  logout: () => {
    clearAuthStorage();
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },

  hasRole: (role: string) => {
    const roles = (get().user?.roles || []) as string[];
    return roles.includes(role);
  },

  getPrimaryRole: () => {
    const roles = (get().user?.roles || []) as string[];
    return roles[0] || null;
  },

  isAdmin: () => get().hasRole(Role.SUPER_ADMIN),
  isClinicAdmin: () => get().hasRole(Role.CLINIC_ADMIN),
  isDoctor: () => get().hasRole(Role.DOCTOR),
  isAssistant: () => get().hasRole(Role.ASSISTANT),
  isReceptionist: () => get().hasRole(Role.RECEPTIONIST),
}));