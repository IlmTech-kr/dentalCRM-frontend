"use client";

/**
 * File: src/features/treatments/hooks/useDentalChart.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import { dentalChartService } from "../services/dental-chart.service";
import type {
  CreateDentalChartDto,
  UpdateDentalChartDto,
} from "@/src/types/dental-chart.types";

export function useDentalChart(patientId?: string) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const chartQuery = useQuery({
    queryKey: ["dental-chart", patientId],
    queryFn: () => dentalChartService.getByPatient(patientId!),
    enabled: Boolean(patientId) && isAuthenticated,
  });

  const createChartMutation = useMutation({
    mutationFn: (payload: CreateDentalChartDto) =>
      dentalChartService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["dental-chart", data.patientId],
      });
    },
  });

  const updateChartMutation = useMutation({
    mutationFn: ({ chartId, payload }: { chartId: string; payload: UpdateDentalChartDto }) =>
      dentalChartService.update(chartId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["dental-chart", data.patientId],
      });
    },
  });

  const deleteChartMutation = useMutation({
    mutationFn: (chartId: string) => dentalChartService.delete(chartId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dental-chart", patientId],
      });
    },
  });

  return {
    chart: chartQuery.data,
    isLoading: chartQuery.isLoading,
    isFetching: chartQuery.isFetching,
    error: chartQuery.error,
    refetch: chartQuery.refetch,

    createChart: createChartMutation.mutateAsync,
    isCreating: createChartMutation.isPending,

    updateChart: updateChartMutation.mutateAsync,
    isUpdating: updateChartMutation.isPending,

    deleteChart: deleteChartMutation.mutateAsync,
    isDeleting: deleteChartMutation.isPending,
  };
}