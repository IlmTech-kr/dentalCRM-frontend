"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deactivateRecurringExpense,
} from "../services/recurringExpense.service";
import type { CreateRecurringExpenseDto, UpdateRecurringExpenseDto } from "../types";

export const recurringExpenseKeys = {
  all: ["recurring-expenses"] as const,
  lists: () => [...recurringExpenseKeys.all, "list"] as const,
};

export function useGetRecurringExpenses(options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: recurringExpenseKeys.lists(),
    queryFn: getRecurringExpenses,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRecurringExpenseDto) => createRecurringExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useCreateRecurringExpense] failed:", error.message);
      }
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRecurringExpenseDto) => updateRecurringExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useUpdateRecurringExpense] failed:", error.message);
      }
    },
  });
}

export function useDeactivateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useDeactivateRecurringExpense] failed:", error.message);
      }
    },
  });
}
