// File: src/features/auth/hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  login,
  registerClinic,
  forgotPassword,
  resetPassword,
  logout as logoutService,
} from '../auth.service';
import type {
  LoginDto,
  RegisterClinicDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@/src/types/auth.types';

/**
 * Hook: Login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError, LoginDto>({
    mutationFn: (credentials) => login(credentials),
    onSuccess: (data) => {
      // Clear all cached data on login
      queryClient.clear();

      // Set auth data in cache if needed
      console.log('Login successful');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

/**
 * Hook: Register Clinic
 */
export function useRegisterClinic() {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError, RegisterClinicDto>({
    mutationFn: (data) => registerClinic(data),
    onSuccess: (data) => {
      console.log('Clinic registered successfully');
    },
    onError: (error) => {
      console.error('Clinic registration failed:', error);
    },
  });
}

/**
 * Hook: Forgot Password
 */
export function useForgotPassword() {
  return useMutation<any, AxiosError, ForgotPasswordDto>({
    mutationFn: (data) => forgotPassword(data),
    onSuccess: (data) => {
      console.log('Password reset link sent');
    },
    onError: (error) => {
      console.error('Forgot password failed:', error);
    },
  });
}

/**
 * Hook: Reset Password
 */
export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError, ResetPasswordDto>({
    mutationFn: (data) => resetPassword(data),
    onSuccess: (data) => {
      // Clear all data on password reset
      queryClient.clear();
      console.log('Password reset successfully');
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
    },
  });
}

/**
 * Hook: Logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      logoutService();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      console.log('Logged out successfully');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });
}