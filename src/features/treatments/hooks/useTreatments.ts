"use client";

/**
 * File: src/features/treatments/hooks/useTreatments.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";

import {
  createChart,
  deleteChart,
  getChart,
  getChartByPatientId,
  updateChart,
} from "../services/treatment.service";

import type {
  CreateChartPayload,
  UpdateChartPayload,
} from "@/src/types/treatment.types";

export const dentalChartKeys = {
  all: ["dental-charts"] as const,
  detail: (chartId: string) => ["dental-charts", chartId] as const,
  patient: (patientId: string) => ["dental-charts", "patient", patientId] as const,
};

export function useChart(chartId?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: dentalChartKeys.detail(chartId || ""),
    queryFn: () => getChart(chartId as string),
    enabled: Boolean(chartId) && isAuthenticated,
  });
}

export function useChartByPatientId(patientId?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: dentalChartKeys.patient(patientId || ""),
    queryFn: () => getChartByPatientId(patientId as string),
    enabled: Boolean(patientId) && isAuthenticated,
    retry: false,
  });
}

export function useCreateChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChartPayload) => createChart(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dentalChartKeys.all });

      if (data?.patientId) {
        queryClient.invalidateQueries({
          queryKey: dentalChartKeys.patient(data.patientId),
        });
      }
    },
  });
}

export function useUpdateChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chartId, payload }: { chartId: string; payload: UpdateChartPayload }) =>
      updateChart(chartId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dentalChartKeys.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: dentalChartKeys.patient(data.patientId) });
    },
  });
}

export function useDeleteChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chartId: string) => deleteChart(chartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dentalChartKeys.all });
    },
  });
}