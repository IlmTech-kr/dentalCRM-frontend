"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
} from "../services/expenseCategory.service";
import type { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from "../types";

export const expenseCategoryKeys = {
  all: ["expense-categories"] as const,
  lists: () => [...expenseCategoryKeys.all, "list"] as const,
};

export function useGetExpenseCategories() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: expenseCategoryKeys.lists(),
    queryFn: getExpenseCategories,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryDto) => createExpenseCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useCreateExpenseCategory] failed:", error.message);
      }
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateExpenseCategoryDto) => updateExpenseCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useUpdateExpenseCategory] failed:", error.message);
      }
    },
  });
}
