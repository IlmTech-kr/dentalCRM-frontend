"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dentalProcedureService } from "../services/dental-procedure.service";
import type {
  CreateDentalProcedureDto,
  UpdateDentalProcedureDto,
} from "@/src/types/dental-procedure.types";

export function useDentalProcedures(search?: string) {
  const queryClient = useQueryClient();

  const proceduresQuery = useQuery({
    queryKey: ["dental-procedures", search || ""],
    queryFn: () => dentalProcedureService.getAll(search),
    staleTime: 1000 * 30,
  });

  const createProcedureMutation = useMutation({
    mutationFn: (payload: CreateDentalProcedureDto) =>
      dentalProcedureService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dental-procedures"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["dental-procedures"],
      });
    },
  });

  const deleteProcedureMutation = useMutation({
    mutationFn: (procedureId: string) =>
      dentalProcedureService.delete(procedureId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dental-procedures"],
      });
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