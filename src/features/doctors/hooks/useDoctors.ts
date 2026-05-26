// File: src/features/doctors/hooks/useDoctors.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getDoctors,
  getDoctorById,
  inviteDoctor,
  updateDoctor,
  deleteDoctor,
} from "../doctor.service";

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

/**
 * Hook: Get all doctors
 */
export function useGetDoctors() {
  return useQuery<Doctor[]>({
    queryKey: doctorKeys.lists(),
    queryFn: () => getDoctors(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Get doctor by ID
 */
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

    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Invite doctor
 */
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

/**
 * Hook: Update doctor
 */
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

/**
 * Hook: Delete doctor
 */
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