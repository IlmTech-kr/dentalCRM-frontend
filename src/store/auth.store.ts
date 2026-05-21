// auth.store.ts
import { create } from "zustand";
import { AuthUser } from "../types/auth.types";

interface AuthState {
  user: AuthUser | null;
  subDomain: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Setters
  setUser: (user: AuthUser) => void;
  setSubDomain: (subDomain: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;

  // ✅ NEW: Helper methods for roles
  hasRole: (role: string) => boolean;
  getPrimaryRole: () => string | null;
  isAdmin: () => boolean;
  isClinicAdmin: () => boolean;
  isDoctor: () => boolean;
  isAssistant: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  subDomain:
    typeof window !== "undefined"
      ? localStorage.getItem("subDomain")
      : null,
  accessToken:
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null,
  isAuthenticated:
    typeof window !== "undefined"
      ? Boolean(localStorage.getItem("accessToken"))
      : false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  setSubDomain: (subDomain) => {
    localStorage.setItem("subDomain", subDomain);
    set({ subDomain });
  },

  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
    set({
      accessToken: token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("subDomain");

    set({
      user: null,
      subDomain: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  // ✅ NEW: Check if user has specific role
  hasRole: (role: string) => {
    const { user } = get();
    return user?.roles?.includes(role as any) || false;
  },

  // ✅ NEW: Get primary (first) role
  getPrimaryRole: () => {
    const { user } = get();
    return user?.roles?.[0] || null;
  },

  // ✅ NEW: Check if SUPER_ADMIN
  isAdmin: () => {
    const { user } = get();
    return user?.roles?.includes("SUPER_ADMIN") || false;
  },

  // ✅ NEW: Check if CLINIC_ADMIN
  isClinicAdmin: () => {
    const { user } = get();
    return user?.roles?.includes("CLINIC_ADMIN") || false;
  },

  // ✅ NEW: Check if DOCTOR
  isDoctor: () => {
    const { user } = get();
    return user?.roles?.includes("DOCTOR") || false;
  },

  // ✅ NEW: Check if ASSISTANT
  isAssistant: () => {
    const { user } = get();
    return user?.roles?.includes("ASSISTANT") || false;
  },
}));