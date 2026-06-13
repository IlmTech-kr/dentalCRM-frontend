import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  getAppointmentsByDate,
  updateAppointment,
} from "../appointment.service";

import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

export const appointmentKeys = {
  all: ["appointments"] as const,

  lists: () => [...appointmentKeys.all, "list"] as const,

  list: (page: number, limit: number) =>
    [...appointmentKeys.lists(), { page, limit }] as const,

  byDate: (date: string) =>
    [...appointmentKeys.all, "by-date", date] as const,

  details: () => [...appointmentKeys.all, "detail"] as const,

  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

/**
 * GET /api/dental/appointments?page=0&limit=10
 */
export function useGetAppointments(page = 0, limit = 10) {
  return useQuery<Appointment[]>({
    queryKey: appointmentKeys.list(page, limit),
    queryFn: () => getAppointments(page, limit),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * GET /api/dental/appointments/:id
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * GET /api/dental/appointments/by-date?date=2026-06-06
 */
export function useGetAppointmentsByDate(date: string | null) {
  return useQuery<Appointment[]>({
    queryKey: date
      ? appointmentKeys.byDate(date)
      : ["appointments-by-date-disabled"],

    queryFn: () => {
      if (!date) {
        throw {
          code: "APPOINTMENT_DATE_REQUIRED",
          message: "Appointment date is required",
        };
      }

      return getAppointmentsByDate(date);
    },

    enabled: !!date,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * POST /api/dental/appointments
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, unknown, CreateAppointmentDto>({
    mutationFn: (payload) => createAppointment(payload),

    onSuccess: (createdAppointment) => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all,
      });

      if (createdAppointment.appointmentDate) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.byDate(createdAppointment.appointmentDate),
        });
      }
    },
  });
}

/**
 * PUT /api/dental/appointments/:id
 *
 * This hook is also used for status update:
 * status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    unknown,
    {
      appointmentId: string;
      payload: UpdateAppointmentDto;
    }
  >({
    mutationFn: ({ appointmentId, payload }) =>
      updateAppointment(appointmentId, payload),

    onSuccess: (updatedAppointment, variables) => {
      queryClient.setQueryData(
        appointmentKeys.detail(variables.appointmentId),
        updatedAppointment
      );

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all,
      });

      if (updatedAppointment.appointmentDate) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.byDate(updatedAppointment.appointmentDate),
        });
      }
    },
  });
}

/**
 * DELETE /api/dental/appointments/:id
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

      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all,
      });
    },
  });
}

/**
 * Optional aliases
 */
export const useAppointments = useGetAppointments;
export const useAppointment = useGetAppointment;
export const useAppointmentsByDate = useGetAppointmentsByDate;