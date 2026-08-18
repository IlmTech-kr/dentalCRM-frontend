"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClinicProfile,
  updateClinicProfile,
  getPublicClinicProfile,
} from "../clinicProfile.service";
import type { ClinicPublicProfile } from "@/src/types/clinicProfile.types";

export const clinicProfileKeys = {
  all: ["clinicProfile"] as const,
  mine: () => [...clinicProfileKeys.all, "mine"] as const,
  public: () => [...clinicProfileKeys.all, "public"] as const,
};

/** CLINIC_ADMIN — Settings > Socials shu bilan o'qiydi. */
export function useGetClinicProfile() {
  return useQuery<ClinicPublicProfile>({
    queryKey: clinicProfileKeys.mine(),
    queryFn: getClinicProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useUpdateClinicProfile() {
  const queryClient = useQueryClient();

  return useMutation<ClinicPublicProfile, Error, ClinicPublicProfile>({
    mutationFn: (payload) => updateClinicProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(clinicProfileKeys.mine(), data);
    },
  });
}

/** Autentifikatsiyasiz — ommaviy /socials sahifasi shu bilan o'qiydi. */
export function useGetPublicClinicProfile() {
  return useQuery<ClinicPublicProfile>({
    queryKey: clinicProfileKeys.public(),
    queryFn: getPublicClinicProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
