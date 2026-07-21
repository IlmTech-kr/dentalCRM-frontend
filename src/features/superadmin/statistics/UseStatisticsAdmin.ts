"use client";

import { useQuery } from "@tanstack/react-query";
import { getRevenueByClinic } from "./statistics.admin.service";
import type { RevenueByClinicParams } from "./statistics.admin.service";

export function useRevenueByClinic(params: RevenueByClinicParams) {
  return useQuery({
    queryKey: ["superadmin", "revenue-by-clinic", params],
    queryFn: () => getRevenueByClinic(params),
    enabled: Boolean(params.fromDate && params.toDate),
  });
}