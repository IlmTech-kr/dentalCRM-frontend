"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./subscriptions-admin.service";
import type {
  TenantListParams,
  ActivateSubscriptionPayload,
} from "./subscriptions-admin.service";

export function useTenants(params: TenantListParams) {
  return useQuery({
    queryKey: ["superadmin", "tenants", params],
    queryFn: () => api.getTenants(params),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => api.suspendTenant(tenantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin", "tenants"] }),
  });
}

export function useTenantLimits(tenantId: string | null) {
  return useQuery({
    queryKey: ["superadmin", "tenant-limits", tenantId],
    queryFn: () => api.getTenantLimits(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: Record<string, unknown>;
    }) => api.updateTenantLimits(tenantId, payload),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["superadmin", "tenant-limits", vars.tenantId] }),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["superadmin", "plans"],
    queryFn: () => api.getPlans(),
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActivateSubscriptionPayload) => api.activateSubscription(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin", "tenants"] }),
  });
}