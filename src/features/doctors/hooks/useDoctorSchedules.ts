import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDoctorSchedule,
  getDoctorScheduleById,
  getDoctorSchedules,
  updateDoctorSchedule,
} from "../services/doctor-schedule.service";
import type {
  DoctorSchedulePayload,
  UpdateDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

export const doctorScheduleKeys = {
  all: ["doctor-schedules"] as const,
  list: (page: number, limit: number) =>
    ["doctor-schedules", page, limit] as const,
  detail: (id: string) => ["doctor-schedules", id] as const,
};

export function useDoctorSchedules(page = 0, limit = 20) {
  return useQuery({
    queryKey: doctorScheduleKeys.list(page, limit),
    queryFn: () => getDoctorSchedules(page, limit),
  });
}

export function useDoctorSchedule(id: string) {
  return useQuery({
    queryKey: doctorScheduleKeys.detail(id),
    queryFn: () => getDoctorScheduleById(id),
    enabled: !!id,
  });
}

export function useCreateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoctorSchedulePayload) =>
      createDoctorSchedule(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: doctorScheduleKeys.all,
      });
    },
  });
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDoctorSchedulePayload;
    }) => updateDoctorSchedule(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: doctorScheduleKeys.all,
      });
    },
  });
}