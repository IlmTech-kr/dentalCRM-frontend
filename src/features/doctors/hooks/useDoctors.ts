"use client";

/**
 * File: src/features/doctors/hooks/useDoctors.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDoctor,
  getDoctorById,
  getDoctors,
  inviteDoctor,
  updateDoctor,
} from "../services/doctor.service";

import { useAuthStore } from "@/src/store/auth.store";

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Doctor[], Error>({
    queryKey: doctorKeys.lists(),
    queryFn: getDoctors,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useGetDoctor(doctorId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Doctor, Error>({
    queryKey: doctorKeys.detail(doctorId ?? ""),
    queryFn: () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      return getDoctorById(doctorId);
    },
    enabled: Boolean(doctorId) && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useInviteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, InviteDoctorDto>({
    mutationFn: inviteDoctor,

    onSuccess: () => {
      /**
       * invalidateQueries avtomatik refetch qiladi.
       * DoctorsPage da alohida refetch() chaqirish shart emas.
       */
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
    },
  });
}

export function useUpdateDoctor(doctorId: string) {
  const queryClient = useQueryClient();

  return useMutation<Doctor, Error, UpdateDoctorDto>({
    mutationFn: (payload) => updateDoctor(doctorId, payload),

    onSuccess: (updatedDoctor) => {
      queryClient.setQueryData(doctorKeys.detail(doctorId), updatedDoctor);
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteDoctor,

    onSuccess: (_, deletedDoctorId) => {
      queryClient.removeQueries({ queryKey: doctorKeys.detail(deletedDoctorId) });
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
    },
  });
}