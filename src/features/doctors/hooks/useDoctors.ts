import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

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

// Query keys
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
  return useQuery<Doctor[], AxiosError>({
    queryKey: doctorKeys.lists(),
    queryFn: () => getDoctors(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Get single doctor by ID
 */
export function useGetDoctor(doctorId: string | null) {
  return useQuery<Doctor, AxiosError>({
    queryKey: doctorId ? doctorKeys.detail(doctorId) : ["doctor-disabled"],
    queryFn: () => {
      if (!doctorId) {
        throw new Error("Doctor ID is required");
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
 *
 * This does not directly create a completed doctor account.
 * It sends an invite email. Doctor finishes signup from email link.
 */
export function useInviteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, InviteDoctorDto>({
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

  return useMutation<Doctor, AxiosError, UpdateDoctorDto>({
    mutationFn: (payload) => updateDoctor(doctorId, payload),
    onSuccess: (updatedDoctor) => {
      queryClient.setQueryData(doctorKeys.detail(doctorId), updatedDoctor);

      queryClient.invalidateQueries({
        queryKey: doctorKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to update doctor:", error);
    },
  });
}

/**
 * Hook: Delete doctor
 */
export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (doctorId) => deleteDoctor(doctorId),
    onSuccess: (_, deletedDoctorId) => {
      queryClient.removeQueries({
        queryKey: doctorKeys.detail(deletedDoctorId),
      });

      queryClient.invalidateQueries({
        queryKey: doctorKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete doctor:", error);
    },
  });
}