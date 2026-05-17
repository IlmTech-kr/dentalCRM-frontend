import { create } from "zustand";
import { AuthUser } from "../types/auth.types";

interface AuthState {
  user: AuthUser | null;
  subDomain: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: AuthUser) => void;
  setSubDomain: (subDomain: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
}));