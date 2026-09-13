"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMarketingLeads,
  getMarketingStatistics,
  updateMarketingLeadStatus,
} from "./marketing.admin.service";
import type { MarketingLeadStatus } from "./marketing.admin.service";

export function useMarketingStatistics(fromMonth: string, toMonth: string) {
  return useQuery({
    queryKey: ["superadmin", "marketing-statistics", fromMonth, toMonth],
    queryFn: () => getMarketingStatistics(fromMonth, toMonth),
  });
}

export function useMarketingLeads(status?: MarketingLeadStatus) {
  return useQuery({
    queryKey: ["superadmin", "marketing-leads", status],
    queryFn: () => getMarketingLeads({ page: 0, limit: 50, status }),
  });
}

export function useUpdateMarketingLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MarketingLeadStatus }) =>
      updateMarketingLeadStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "marketing-leads"] });
    },
  });
}
