"use client";

/**
 * File:
 * src/features/superadmin/subscriptions/UseSupscriptionAdmin.ts
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as api from "./subscriptions-admin.service";

import type {
  ActivateSubscriptionPayload,
  TenantListParams,
  UpdateSubscriptionPlanPayload,
} from "./subscriptions-admin.service";

export function useTenants(
  params: TenantListParams = {}
) {
  return useQuery({
    queryKey: [
      "superadmin",
      "tenants",
      params,
    ],
    queryFn: () =>
      api.getTenants(params),
  });
}

export function useSuspendTenant() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      tenantId: string
    ) =>
      api.suspendTenant(tenantId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenants",
        ],
      });
    },
  });
}

export function useTenantLimits(
  tenantId: string | null
) {
  return useQuery({
    queryKey: [
      "superadmin",
      "tenant-limits",
      tenantId,
    ],

    queryFn: () =>
      api.getTenantLimits(
        tenantId as string
      ),

    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantLimits() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: Record<string, unknown>;
    }) =>
      api.updateTenantLimits(
        tenantId,
        payload
      ),

    onSuccess: async (
      _data,
      variables
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenant-limits",
          variables.tenantId,
        ],
      });
    },
  });
}

/* =====================================================
 * PLANS
 * ===================================================== */

export function usePlans() {
  return useQuery({
    queryKey: [
      "superadmin",
      "plans",
    ],

    queryFn: () =>
      api.getPlans(),
  });
}

export function usePlan(
  planType: string | null
) {
  return useQuery({
    queryKey: [
      "superadmin",
      "plan",
      planType,
    ],

    queryFn: () =>
      api.getPlan(
        planType as string
      ),

    enabled: Boolean(planType),
  });
}

export function useUpdatePlan() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      planType,
      payload,
    }: {
      planType: string;
      payload: UpdateSubscriptionPlanPayload;
    }) =>
      api.updatePlan(
        planType,
        payload
      ),

    onSuccess: async (
      _data,
      variables
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "plans",
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "plan",
          variables.planType,
        ],
      });
    },
  });
}

/* =====================================================
 * ACTIVATE
 * ===================================================== */

export function useActivateSubscription() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: ActivateSubscriptionPayload
    ) =>
      api.activateSubscription(
        payload
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenants",
        ],
      });
    },
  });
}