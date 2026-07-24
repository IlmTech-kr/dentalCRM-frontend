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
} from "./subscriptions-admin.service";

/* =====================================================
 * TENANTS
 * ===================================================== */

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

    staleTime: 30_000,
  });
}

/* =====================================================
 * SUSPEND TENANT
 * ===================================================== */

export function useSuspendTenant() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      tenantId: string
    ) =>
      api.suspendTenant(
        tenantId
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenants",
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "clinics",
        ],
      });
    },
  });
}

/* =====================================================
 * TENANT LIMITS
 * ===================================================== */

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

    enabled: Boolean(
      tenantId
    ),

    staleTime: 30_000,
  });
}

/* =====================================================
 * UPDATE LIMITS
 * ===================================================== */

export function useUpdateTenantLimits() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: Record<
        string,
        unknown
      >;
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

      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenants",
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

    staleTime: 60_000,
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

    enabled: Boolean(
      planType
    ),

    staleTime: 60_000,
  });
}

/* =====================================================
 * ACTIVATE SUBSCRIPTION
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

    onSuccess: async (
      _data,
      variables
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenants",
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "tenant-limits",
          variables.tenantId,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "superadmin",
          "clinics",
        ],
      });
    },
  });
}