// File: src/features/appointments/hooks/useAppointments.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment,
} from "../appointment.service";

export const appointmentKeys = {
  all: ["appointments"] as const,

  lists: () => [...appointmentKeys.all, "list"] as const,

  list: (page: number, limit: number) =>
    [...appointmentKeys.lists(), { page, limit }] as const,

  details: () => [...appointmentKeys.all, "detail"] as const,

  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

/**
 * Hook: Get appointments
 */
export function useGetAppointments(page = 0, limit = 10) {
  return useQuery<Appointment[]>({
    queryKey: appointmentKeys.list(page, limit),
    queryFn: () => getAppointments(page, limit),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Get single appointment by ID
 */
export function useGetAppointment(appointmentId: string | null) {
  return useQuery<Appointment>({
    queryKey: appointmentId
      ? appointmentKeys.detail(appointmentId)
      : ["appointment-disabled"],

    queryFn: () => {
      if (!appointmentId) {
        throw {
          code: "APPOINTMENT_ID_REQUIRED",
          message: "Appointment ID is required",
        };
      }

      return getAppointmentById(appointmentId);
    },

    enabled: !!appointmentId,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Create appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, CreateAppointmentDto>({
    mutationFn: (payload) => createAppointment(payload),

    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });

      queryClient.setQueryData(
        appointmentKeys.detail(newAppointment.id),
        newAppointment
      );
    },
  });
}

/**
 * Hook: Update appointment
 */
export function useUpdateAppointment(appointmentId: string) {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, UpdateAppointmentDto>({
    mutationFn: (payload) => updateAppointment(appointmentId, payload),

    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(appointmentId),
        updatedAppointment
      );

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });
    },
  });
}

/**
 * Hook: Delete appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (appointmentId) => deleteAppointment(appointmentId),

    onSuccess: (_, deletedAppointmentId) => {
      queryClient.removeQueries({
        queryKey: appointmentKeys.detail(deletedAppointmentId),
      });

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });
    },
  });
}