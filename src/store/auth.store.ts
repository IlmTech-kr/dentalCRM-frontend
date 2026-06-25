"use client";

/**
 * File: src/store/auth.store.ts
 */

import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";
import { Role } from "../lib/enums/enums.types";
import {
  getStoredAccessToken,
  getStoredUser,
  saveAccessToken,
  saveUser,
  clearAuthStorage,
} from "@/src/lib/auth/storage";

type AuthDataPayload = {
  user?: AuthUser | null;
  accessToken?: string | null;
  isAuthenticated?: boolean;
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
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

// Initial hydration — store yaratilganda bir marta
const initialUser = getStoredUser<AuthUser>();
const initialAccessToken = getStoredAccessToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  accessToken: initialAccessToken,
  isAuthenticated: Boolean(initialAccessToken),
  isHydrated: isBrowser(),

  setUser: (user) => {
    // Shared helper orqali
    saveUser(user);

    set({
      user,
      isAuthenticated: Boolean(get().accessToken || user),
      isHydrated: true,
    });
  },

  setAccessToken: (token) => {
    saveAccessToken(token);

    set({
      accessToken: token,
      isAuthenticated: Boolean(token),
      isHydrated: true,
    });
  },

  setAuthenticated: (value) => {
    set({
      isAuthenticated: value,
      isHydrated: true,
    });
  },

  setAuthData: (data) => {
    if (data.user !== undefined) {
      saveUser(data.user);
    }

    if (data.accessToken !== undefined) {
      saveAccessToken(data.accessToken);
    }

    const nextUser =
      data.user !== undefined ? data.user : get().user;

    const nextAccessToken =
      data.accessToken !== undefined ? data.accessToken : get().accessToken;

    set({
      user: nextUser,
      accessToken: nextAccessToken,
      isAuthenticated:
        data.isAuthenticated !== undefined
          ? data.isAuthenticated
          : Boolean(nextAccessToken),
      isHydrated: true,
    });
  },

  hydrateFromStorage: () => {
    const user = getStoredUser<AuthUser>();
    const accessToken = getStoredAccessToken();

    set({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isHydrated: true,
    });
  },

  logout: () => {
    // Bitta shared clearAuthStorage — hamma key to'g'ri o'chadi
    clearAuthStorage();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });
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