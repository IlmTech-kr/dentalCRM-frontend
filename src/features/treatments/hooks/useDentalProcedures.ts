"use client";

/**
 * File: src/features/treatments/hooks/useDentalProcedures.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dentalProcedureService } from "../services/dental-procedure.service";
import { useAuthStore } from "@/src/store/auth.store";

import type {
  CreateDentalProcedureDto,
  UpdateDentalProcedureDto,
} from "@/src/types/dental-procedure.types";

export const procedureKeys = {
  all: ["dental-procedures"] as const,
  lists: () => [...procedureKeys.all, "list"] as const,
  list: (search: string) => [...procedureKeys.lists(), { search }] as const,
  detail: (id: string) => [...procedureKeys.all, "detail", id] as const,
};

export function useDentalProcedures(search?: string) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const proceduresQuery = useQuery({
    queryKey: procedureKeys.list(search || ""),
    queryFn: () => dentalProcedureService.getAll(search),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });

  const createProcedureMutation = useMutation({
    mutationFn: (payload: CreateDentalProcedureDto) =>
      dentalProcedureService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: ({
      procedureId,
      payload,
    }: {
      procedureId: string;
      payload: UpdateDentalProcedureDto;
    }) => dentalProcedureService.update(procedureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
    },
  });

  const deleteProcedureMutation = useMutation({
    mutationFn: (procedureId: string) =>
      dentalProcedureService.delete(procedureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
    },
  });

  return {
    procedures: proceduresQuery.data || [],
    isLoading: proceduresQuery.isLoading,
    isFetching: proceduresQuery.isFetching,
    error: proceduresQuery.error,
    refetch: proceduresQuery.refetch,

    createProcedure: createProcedureMutation.mutateAsync,
    isCreating: createProcedureMutation.isPending,

    updateProcedure: updateProcedureMutation.mutateAsync,
    isUpdating: updateProcedureMutation.isPending,

    deleteProcedure: deleteProcedureMutation.mutateAsync,
    isDeleting: deleteProcedureMutation.isPending,
  };
}