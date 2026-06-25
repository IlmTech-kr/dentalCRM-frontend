"use client";

/**
 * File: src/features/appointments/hooks/useAppointments.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  getAppointmentsByDate,
  updateAppointment,
} from "../appointment.service";

import { useAuthStore } from "@/src/store/auth.store";

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
  byDate: (date: string) => [...appointmentKeys.all, "by-date", date] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

/**
 * GET /api/dental/appointments?page=0&limit=10
 */
export function useGetAppointments(page = 0, limit = 10) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Appointment[]>({
    queryKey: appointmentKeys.list(page, limit),
    queryFn: () => getAppointments(page, limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * GET /api/dental/appointments/:id
 */
export function useGetAppointment(appointmentId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Appointment>({
    queryKey: appointmentKeys.detail(appointmentId ?? ""),
    queryFn: () => {
      if (!appointmentId) throw new Error("Appointment ID is required");
      return getAppointmentById(appointmentId);
    },
    enabled: Boolean(appointmentId) && isAuthenticated,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * GET /api/dental/appointments/by-date?date=2026-06-06
 */
export function useGetAppointmentsByDate(date: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Appointment[]>({
    queryKey: appointmentKeys.byDate(date ?? ""),
    queryFn: () => {
      if (!date) throw new Error("Appointment date is required");
      return getAppointmentsByDate(date);
    },
    enabled: Boolean(date) && isAuthenticated,
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
    mutationFn: createAppointment,

    onSuccess: (createdAppointment) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });

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
 * Status update uchun ham ishlatiladi.
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    unknown,
    { appointmentId: string; payload: UpdateAppointmentDto }
  >({
    mutationFn: ({ appointmentId, payload }) =>
      updateAppointment(appointmentId, payload),

    onSuccess: (updatedAppointment, variables) => {
      queryClient.setQueryData(
        appointmentKeys.detail(variables.appointmentId),
        updatedAppointment
      );

      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });

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
    mutationFn: deleteAppointment,

    onSuccess: (_, deletedAppointmentId) => {
      queryClient.removeQueries({
        queryKey: appointmentKeys.detail(deletedAppointmentId),
      });

      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });

      /**
       * byDate invalidate qila olmaymiz — deleted appointment ning
       * appointmentDate si yo'q. Shuning uchun barcha byDate ni invalidate.
       */
      queryClient.invalidateQueries({
        queryKey: [...appointmentKeys.all, "by-date"],
      });
    },
  });
}

export const useAppointments = useGetAppointments;
export const useAppointment = useGetAppointment;
export const useAppointmentsByDate = useGetAppointmentsByDate;