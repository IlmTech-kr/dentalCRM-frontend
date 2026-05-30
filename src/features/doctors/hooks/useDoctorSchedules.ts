import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getDoctorSchedules,
  getDoctorScheduleById,
  createDoctorSchedule,
  createWeeklyDoctorSchedule,
  updateDoctorSchedule,
} from "../services/doctor-schedule.service";

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

/**
 * Hook: Get all doctor schedules
 */
export function useGetDoctorSchedules(page = 0, limit = 20) {
  return useQuery<DoctorSchedule[]>({
    queryKey: doctorScheduleKeys.list(page, limit),
    queryFn: () => getDoctorSchedules(page, limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Get doctor schedule by ID
 */
export function useGetDoctorSchedule(scheduleId: string | null) {
  return useQuery<DoctorSchedule>({
    queryKey: scheduleId
      ? doctorScheduleKeys.detail(scheduleId)
      : ["doctor-schedule-disabled"],

    queryFn: () => {
      if (!scheduleId) {
        throw {
          code: "DOCTOR_SCHEDULE_ID_REQUIRED",
          message: "Doctor schedule ID is required",
        };
      }

      return getDoctorScheduleById(scheduleId);
    },

    enabled: !!scheduleId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Create daily doctor schedule
 */
export function useCreateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, unknown, DoctorSchedulePayload>({
    mutationFn: (payload) => createDoctorSchedule(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: doctorScheduleKeys.lists(),
      });
    },
  });
}

/**
 * Hook: Create weekly doctor schedule
 */
export function useCreateWeeklyDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, unknown, WeeklyDoctorSchedulePayload>({
    mutationFn: (payload) => createWeeklyDoctorSchedule(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: doctorScheduleKeys.lists(),
      });
    },
  });
}

/**
 * Hook: Update doctor schedule
 */
export function useUpdateDoctorSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation<DoctorSchedule, unknown, UpdateDoctorSchedulePayload>({
    mutationFn: (payload) => updateDoctorSchedule(scheduleId, payload),

    onSuccess: (updatedSchedule) => {
      queryClient.setQueryData(
        doctorScheduleKeys.detail(scheduleId),
        updatedSchedule
      );

      queryClient.invalidateQueries({
        queryKey: doctorScheduleKeys.lists(),
      });
    },
  });
}