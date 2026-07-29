"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  cancelPlan,
  getCurrentPlan,
  getPlans,
  getPublicPlans,
} from "@/src/features/subscriptions/services/subscription.service";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  current: () => [...subscriptionKeys.all, "current"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  publicPlans: () => [...subscriptionKeys.all, "public-plans"] as const,
};

export function useGetCurrentPlan() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: getCurrentPlan,
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}

export function useGetPlans() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: getPlans,
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}

/**
 * Login/tenant talab qilmaydi — `/tariffs` kabi ochiq marketing
 * sahifalarida ishlatiladi.
 */
export function usePublicPlans() {
  return useQuery({
    queryKey: subscriptionKeys.publicPlans(),
    queryFn: getPublicPlans,
    staleTime: 1000 * 60,
  });
}

export function useCancelPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}