"use client";

/**
 * File: src/features/auth/hooks/useAuth.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  login,
  registerClinic,
  forgotPassword,
  resetPassword,
  logout as logoutService,
} from "../auth.service";

import { getMe } from "@/src/features/users/user.service";
import { useAuthStore } from "@/src/store/auth.store";
import { getStoredAccessToken } from "@/src/lib/auth/storage";

import type {
  LoginDto,
  RegisterClinicDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginDto) => login(credentials),

    onSuccess: async (data) => {
      /**
       * Login bo'lganda eski querylarni to'liq tozalaymiz.
       * invalidateQueries kerak emas — clear() dan keyin
       * querylar avto refetch bo'ladi (enabled bo'lganlari).
       */
      queryClient.clear();

      /**
       * accessToken storage.ts dagi saveAuthData() orqali
       * login() ichida allaqachon saqlangan.
       *
       * Shuning uchun uni qayta parse qilmaymiz —
       * storage dan o'qiymiz.
       */
      const accessToken = getStoredAccessToken();

      const responseUser =
        data?.user || data?.profile || data?.data?.user || null;

      if (responseUser) {
        useAuthStore.getState().setAuthData({
          user: responseUser,
          accessToken,
          isAuthenticated: true,
        });
      } else {
        /**
         * Login response ichida user qaytmasa:
         * accessToken storage da bor, getMe() Authorization bilan ishlaydi.
         */
        const me = await getMe();

        useAuthStore.getState().setAuthData({
          user: me as any,
          accessToken,
          isAuthenticated: true,
        });
      }

      router.replace("/dashboard");
    },
  });
}

export function useGetProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: isHydrated && isAuthenticated,
    retry: false,
    staleTime: 1000 * 60,
  });
}

export function useRegisterClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterClinicDto) => registerClinic(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authKeys.all,
      });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordDto) => forgotPassword(data),
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResetPasswordDto) => resetPassword(data),

    onSuccess: () => {
      /**
       * Reset password dan keyin eski querylarni tozalaymiz.
       * Redirect komponent o'zi handle qiladi.
       */
      queryClient.clear();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  /**
   * logoutService() o'zi finally blokida:
   * 1. clearAuthStorage() chaqiradi
   * 2. window.location.href = "/login" qiladi
   *
   * Shuning uchun bu yerda redirect kerak emas.
   * store.logout() va queryClient.clear() — ikki holatda ham bir xil.
   */
  function handleLogout() {
    useAuthStore.getState().logout();
    queryClient.clear();
  }

  return useMutation({
    mutationFn: logoutService,
    onSuccess: handleLogout,
    onError: handleLogout,
  });
}