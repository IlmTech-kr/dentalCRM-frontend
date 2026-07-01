// File: src/features/statistics/hooks/useStatistics.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getRevenue,
  getRevenueByClinic,
  RevenueParams,
  RevenueResponse,
} from "../services/statistics.service";

export const statisticsKeys = {
  all: ["statistics"] as const,
  revenue: (params: RevenueParams) => [...statisticsKeys.all, "revenue", params] as const,
  revenueByClinic: (params: Omit<RevenueParams, "filter">) =>
    [...statisticsKeys.all, "revenueByClinic", params] as const,
};

export function useRevenue(params: RevenueParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;
  return useQuery<RevenueResponse>({
    queryKey: statisticsKeys.revenue(queryParams),
    queryFn: () => getRevenue(queryParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled,
  });
}

export function useRevenueByClinic(params: Omit<RevenueParams, "filter">) {
  return useQuery({
    queryKey: statisticsKeys.revenueByClinic(params),
    queryFn: () => getRevenueByClinic(params),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}