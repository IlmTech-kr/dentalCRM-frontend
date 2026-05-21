// File: src/features/user/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  getMe,
  updateMe,
  changePassword,
} from '../user.service';
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from '@/src/types/user.types';

// Query keys for user data
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

/**
 * Hook: Get current user profile
 */
export function useGetProfile() {
  return useQuery<UserProfile, AxiosError>({
    queryKey: userKeys.profile(),
    queryFn: () => getMe(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
    retry: 1,
  });
}

/**
 * Hook: Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, AxiosError, UpdateProfilePayload>({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: (updatedProfile) => {
      // Update cache with new profile
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
      console.log('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

/**
 * Hook: Change password
 */
export function useChangePassword() {
  return useMutation<void, AxiosError, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload),
    onSuccess: () => {
      console.log('Password changed successfully');
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
}