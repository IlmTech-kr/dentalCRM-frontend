"use client";

/**
 * File: src/features/doctors/hooks/useDoctorSchedules.ts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getDoctorSchedules,
  getDoctorScheduleById,
  createDoctorSchedule,
  createWeeklyDoctorSchedule,
  updateDoctorSchedule,
  updateDoctorScheduleByDay,
  deleteDoctorSchedule,
} from "../services/doctor-schedule.service";

import type { UpdateScheduleByDayPayload } from "../services/doctor-schedule.service";

import { useAuthStore } from "@/src/store/auth.store";

import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  UpdateDoctorSchedulePayload,
  WeeklyDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

export const doctorScheduleKeys = {
  all: ["doctor-schedules"] as const,
  lists: () => [...doctorScheduleKeys.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...doctorScheduleKeys.lists(), { page, limit }] as const,
  details: () => [...doctorScheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...doctorScheduleKeys.details(), id] as const,
};

export function useGetDoctorSchedules(page = 0, limit = 20) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<DoctorSchedule[], Error>({
    queryKey: doctorScheduleKeys.list(page, limit),
    queryFn: () => getDoctorSchedules(page, limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useGetDoctorSchedule(scheduleId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<DoctorSchedule, Error>({
    queryKey: doctorScheduleKeys.detail(scheduleId ?? ""),
    queryFn: () => {
      if (!scheduleId) throw new Error("Doctor schedule ID is required");
      return getDoctorScheduleById(scheduleId);
    },
    enabled: Boolean(scheduleId) && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

/**
 * @deprecated Yangi kod uchun useUpdateScheduleByDay ishlatilsin.
 */
export function useCreateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, Error, DoctorSchedulePayload>({
    mutationFn: createDoctorSchedule,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.lists() });
    },
  });
}

/**
 * @deprecated Yangi kod uchun useUpdateScheduleByDay ishlatilsin.
 */
export function useCreateWeeklyDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, Error, WeeklyDoctorSchedulePayload>({
    mutationFn: createWeeklyDoctorSchedule,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.lists() });
    },
  });
}

/**
 * @deprecated Yangi kod uchun useUpdateScheduleByDay ishlatilsin.
 */
export function useUpdateDoctorSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, Error, UpdateDoctorSchedulePayload>({
    mutationFn: (payload) => updateDoctorSchedule(scheduleId, payload),

    onSuccess: (updatedSchedule) => {
      queryClient.setQueryData(
        doctorScheduleKeys.detail(scheduleId),
        updatedSchedule
      );

      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.lists() });
    },
  });
}

/**
 * PUT /api/dental/doctor-schedules/by-day
 *
 * Butun haftalik schedule'ni BIR SO'ROVDA to'liq belgilaydi/yangilaydi.
 * - Doctor o'zi chaqirsa: payload.doctorId bermang (undefined qoldiring) —
 *   backend joriy login qilgan userni token orqali aniqlaydi.
 * - CLINIC_ADMIN/SUPER_ADMIN boshqa doctor uchun chaqirsa: payload.doctorId
 *   MAJBURIY.
 */
export function useUpdateScheduleByDay() {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, Error, UpdateScheduleByDayPayload>({
    mutationFn: updateDoctorScheduleByDay,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.lists() });
    },
  });
}

export function useDeleteDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteDoctorSchedule,

    onSuccess: (_, deletedScheduleId) => {
      queryClient.removeQueries({
        queryKey: doctorScheduleKeys.detail(deletedScheduleId),
      });

      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.lists() });
    },
  });
}