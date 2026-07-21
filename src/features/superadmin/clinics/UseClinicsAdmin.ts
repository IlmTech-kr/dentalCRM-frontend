"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinics, getClinic } from "./clinics.admin.service";
import type { ClinicListParams } from "./clinics.admin.service";

export function useClinics(params: ClinicListParams) {
  return useQuery({
    queryKey: ["superadmin", "clinics", params],
    queryFn: () => getClinics(params),
  });
}

export function useClinic(id: string | null) {
  return useQuery({
    queryKey: ["superadmin", "clinic", id],
    queryFn: () => getClinic(id as string),
    enabled: Boolean(id),
  });
}