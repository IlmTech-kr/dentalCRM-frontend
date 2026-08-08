"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  payExpense,
  voidExpense,
} from "../services/expense.service";
import type {
  CreateExpenseDto,
  ExpenseListParams,
  ExpenseSummaryParams,
  PayExpenseDto,
  VoidExpenseDto,
} from "../types";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (params: ExpenseListParams) => [...expenseKeys.lists(), params] as const,
  summaries: () => [...expenseKeys.all, "summary"] as const,
  summary: (params: ExpenseSummaryParams) => [...expenseKeys.summaries(), params] as const,
};

export function useGetExpenses(params: ExpenseListParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => getExpenses(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useGetExpenseSummary(params: ExpenseSummaryParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: expenseKeys.summary(params),
    queryFn: () => getExpenseSummary(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

function invalidateExpenseQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
  queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpenseDto) => createExpense(payload),
    onSuccess: () => invalidateExpenseQueries(queryClient),
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useCreateExpense] failed:", error.message);
      }
    },
  });
}

export function usePayExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayExpenseDto }) => payExpense(id, payload),
    onSuccess: () => invalidateExpenseQueries(queryClient),
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[usePayExpense] failed:", error.message);
      }
    },
  });
}

export function useVoidExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VoidExpenseDto }) => voidExpense(id, payload),
    onSuccess: () => invalidateExpenseQueries(queryClient),
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useVoidExpense] failed:", error.message);
      }
    },
  });
}
