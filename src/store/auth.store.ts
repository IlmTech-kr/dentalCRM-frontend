import { create } from "zustand";
import { AuthUser } from "../types/auth.types";
import { Role } from "../lib/enums/enums.types"; // 👈 1. Add this import (adjust path if needed)

interface AuthState {
  user: AuthUser | null;
  subDomain: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: AuthUser) => void;
  setSubDomain: (subDomain: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;

  hasRole: (role: string) => boolean;
  getPrimaryRole: () => string | null;
  isAdmin: () => boolean;
  isClinicAdmin: () => boolean;
  isDoctor: () => boolean;
  isAssistant: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  subDomain: typeof window !== "undefined" ? localStorage.getItem("subDomain") : null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  isAuthenticated: typeof window !== "undefined" ? Boolean(localStorage.getItem("accessToken")) : false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  setSubDomain: (subDomain) => {
    localStorage.setItem("subDomain", subDomain);
    set({ subDomain });
  },
  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
    set({ accessToken: token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("subDomain");
    set({ user: null, subDomain: null, accessToken: null, isAuthenticated: false });
  },

  // ✅ Fixed: Safely tell TS to treat the incoming string as a Role
  hasRole: (role: string) => {
    const { user } = get();
    return user?.roles?.includes(role as Role) || false; 
  },

  getPrimaryRole: () => {
    const { user } = get();
    return user?.roles?.[0] || null;
  },

  // ✅ Fixed: Use the Enum directly
  isAdmin: () => {
    const { user } = get();
    return user?.roles?.includes(Role.SUPER_ADMIN) || false;
  },

  // ✅ Fixed: Use the Enum directly
  isClinicAdmin: () => {
    const { user } = get();
    return user?.roles?.includes(Role.CLINIC_ADMIN) || false;
  },

  // ✅ Fixed: Use the Enum directly
  isDoctor: () => {
    const { user } = get();
    return user?.roles?.includes(Role.DOCTOR) || false;
  },

  // ✅ Fixed: Use the Enum directly
  isAssistant: () => {
    const { user } = get();
    return user?.roles?.includes(Role.ASSISTANT) || false;
  },
}));