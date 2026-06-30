"use client";

/**
 * File: src/features/auth/hooks/useAuth.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  login,
  registerClinic,
  forgotPassword,
  resetPassword,
  logout as logoutService,
} from "../auth.service";

import { getMe } from "@/src/features/users/user.service";
import { useAuthStore } from "@/src/store/auth.store";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginDto) => login(credentials),

    onSuccess: async (data) => {
      queryClient.clear();

      const responseUser =
        data?.user || data?.profile || data?.data?.user || null;

      if (responseUser) {
        useAuthStore.getState().setAuthData({
          user: responseUser,
          isAuthenticated: true,
        });
      } else {
        const me = await getMe();
        useAuthStore.getState().setAuthData({
          user: me as any,
          isAuthenticated: true,
        });
      }

      // ❌ router.replace("/dashboard") OLIB TASHLANDI
      // Navigatsiya endi faqat login/page.tsx dagi handleSubmit ichida bo'ladi
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
      queryClient.invalidateQueries({ queryKey: authKeys.all });
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
      queryClient.clear();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

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