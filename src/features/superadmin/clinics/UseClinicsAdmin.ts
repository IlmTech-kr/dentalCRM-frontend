"use client";

/**
 * File:
 * src/features/superadmin/clinics/UseClinicsAdmin.ts
 */

import { useQuery } from "@tanstack/react-query";

import {
  getClinic,
  getClinics,
} from "./clinics.admin.service";

import type {
  ClinicListParams,
} from "./clinics.admin.service";

export function useClinics(
  params: ClinicListParams = {}
) {
  return useQuery({
    queryKey: [
      "superadmin",
      "clinics",
      params,
    ],
    queryFn: () => getClinics(params),
    staleTime: 30_000,
  });
}

export function useClinic(
  clinicId: string | null
) {
  return useQuery({
    queryKey: [
      "superadmin",
      "clinic",
      clinicId,
    ],
    queryFn: () =>
      getClinic(clinicId as string),
    enabled: Boolean(clinicId),
    staleTime: 30_000,
  });
}