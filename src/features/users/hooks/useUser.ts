"use client";

// File: src/features/users/hooks/useUser.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getMe, updateMe, changePassword } from "../user.service";
import { useAuthStore } from "@/src/store/auth.store";

import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/src/types/user.types";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
};

export function useGetProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  return useQuery<UserProfile>({
    queryKey: userKeys.profile(),
    queryFn: getMe,
    enabled: isHydrated && isAuthenticated,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload),
  });
}