// File: src/features/doctors/hooks/useDoctors.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDoctor,
  getDoctorById,
  getDoctors,
  inviteDoctor,
  updateDoctor,
} from "../services/doctor.service";

import type {
  Doctor,
  InviteDoctorDto,
  UpdateDoctorDto,
} from "@/src/types/doctor.types";

export const doctorKeys = {
  all: ["doctors"] as const,

  lists: () => [...doctorKeys.all, "list"] as const,

  list: (filters: string) => [...doctorKeys.lists(), { filters }] as const,

  details: () => [...doctorKeys.all, "detail"] as const,

  detail: (id: string) => [...doctorKeys.details(), id] as const,
};

export function useGetDoctors() {
  return useQuery<Doctor[]>({
    queryKey: doctorKeys.lists(),
    queryFn: () => getDoctors(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useGetDoctor(doctorId: string | null) {
  return useQuery<Doctor>({
    queryKey: doctorId ? doctorKeys.detail(doctorId) : ["doctor-disabled"],

    queryFn: () => {
      if (!doctorId) {
        throw {
          code: "DOCTOR_ID_REQUIRED",
          message: "Doctor ID is required",
        };
      }

      return getDoctorById(doctorId);
    },

    enabled: Boolean(doctorId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useInviteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, InviteDoctorDto>({
    mutationFn: (payload) => inviteDoctor(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: doctorKeys.lists(),
      });
    },
  });
}

export function useUpdateDoctor(doctorId: string) {
  const queryClient = useQueryClient();

  return useMutation<Doctor, unknown, UpdateDoctorDto>({
    mutationFn: (payload) => updateDoctor(doctorId, payload),

    onSuccess: (updatedDoctor) => {
      queryClient.setQueryData(doctorKeys.detail(doctorId), updatedDoctor);

      queryClient.invalidateQueries({
        queryKey: doctorKeys.lists(),
      });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (doctorId) => deleteDoctor(doctorId),

    onSuccess: (_, deletedDoctorId) => {
      queryClient.removeQueries({
        queryKey: doctorKeys.detail(deletedDoctorId),
      });

      queryClient.invalidateQueries({
        queryKey: doctorKeys.lists(),
      });
    },
  });
}