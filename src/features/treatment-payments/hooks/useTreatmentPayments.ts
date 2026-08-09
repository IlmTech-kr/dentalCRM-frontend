"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  createTreatmentPayment,
  getCoursePayments,
  getTreatmentPayments,
  getTreatmentPaymentsSummary,
  voidTreatmentPayment,
} from "../services/treatmentPayment.service";
import type {
  CreateTreatmentPaymentDto,
  TreatmentPaymentListParams,
  TreatmentPaymentsSummaryParams,
  VoidTreatmentPaymentDto,
} from "../types";

export const treatmentPaymentKeys = {
  all: ["treatment-payments"] as const,
  course: (courseId: string) => [...treatmentPaymentKeys.all, "course", courseId] as const,
  lists: () => [...treatmentPaymentKeys.all, "list"] as const,
  list: (params: TreatmentPaymentListParams) => [...treatmentPaymentKeys.lists(), params] as const,
  summaries: () => [...treatmentPaymentKeys.all, "summary"] as const,
  summary: (params: TreatmentPaymentsSummaryParams) => [...treatmentPaymentKeys.summaries(), params] as const,
};

export function useGetCoursePayments(courseId: string | null | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: treatmentPaymentKeys.course(courseId ?? ""),
    queryFn: () => getCoursePayments(courseId as string),
    enabled: Boolean(courseId) && isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useCreateTreatmentPayment(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTreatmentPaymentDto) => createTreatmentPayment(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentPaymentKeys.course(courseId) });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useCreateTreatmentPayment] failed:", error.message);
      }
    },
  });
}

export function useVoidTreatmentPayment(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: VoidTreatmentPaymentDto }) =>
      voidTreatmentPayment(courseId, paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentPaymentKeys.course(courseId) });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useVoidTreatmentPayment] failed:", error.message);
      }
    },
  });
}

export function useGetTreatmentPayments(params: TreatmentPaymentListParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: treatmentPaymentKeys.list(params),
    queryFn: () => getTreatmentPayments(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useGetTreatmentPaymentsSummary(params: TreatmentPaymentsSummaryParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: treatmentPaymentKeys.summary(params),
    queryFn: () => getTreatmentPaymentsSummary(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

/** Global ekranda void — courseId har bir qatorda alohida bo'lgani uchun ixtiyoriy parametr. */
export function useVoidTreatmentPaymentGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      paymentId,
      payload,
    }: {
      courseId: string;
      paymentId: string;
      payload: VoidTreatmentPaymentDto;
    }) => voidTreatmentPayment(courseId, paymentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: treatmentPaymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: treatmentPaymentKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: treatmentPaymentKeys.course(variables.courseId) });
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useVoidTreatmentPaymentGlobal] failed:", error.message);
      }
    },
  });
}
