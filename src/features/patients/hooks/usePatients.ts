"use client";

/**
 * File: src/features/patients/hooks/usePatients.ts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getPatients,
  getPatientById,
  searchPatientByPhone,
  createPatient,
  updatePatient,
  deletePatient,
} from "../patient.service";

import { useAuthStore } from "@/src/store/auth.store";

import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
} from "@/src/types/patient.types";

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters: string) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (phone: string) => [...patientKeys.all, "search", phone] as const,
};

export function useGetPatients() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Patient[], Error>({
    queryKey: patientKeys.lists(),
    queryFn: getPatients,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useGetPatient(patientId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Patient, Error>({
    queryKey: patientKeys.detail(patientId ?? ""),
    queryFn: () => {
      if (!patientId) throw new Error("Patient ID is required");
      return getPatientById(patientId);
    },
    enabled: Boolean(patientId) && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useSearchPatientByPhone(phone: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  /**
   * Tashqaridan faqat 12 raqamli (998XXXXXXXXX) telefon kelishi kerak.
   * Bu yerda faqat digits olamiz — search service o'zi ham normalize qiladi.
   */
  const cleanPhone = phone?.replace(/\D/g, "") ?? "";

  return useQuery<Patient[], Error>({
    queryKey: cleanPhone
      ? patientKeys.search(cleanPhone)
      : [...patientKeys.all, "search-disabled"],
    queryFn: () => {
      if (!cleanPhone) return [];
      return searchPatientByPhone(cleanPhone);
    },
    /**
     * enabled da ham 12 raqam tekshiramiz —
     * patient.service.ts dagi >= 9 fallback emas, bu primary check.
     */
    enabled: cleanPhone.length === 12 && isAuthenticated,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, CreatePatientDto>({
    mutationFn: createPatient,

    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });

      if (newPatient?.id) {
        queryClient.setQueryData(patientKeys.detail(newPatient.id), newPatient);
      }
    },

    onError: (error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useCreatePatient] failed:", error.message);
      }
    },
  });
}

export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, UpdatePatientDto>({
    mutationFn: (payload) => updatePatient(patientId, payload),

    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(
        patientKeys.detail(patientId),
        updatedPatient
      );

      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },

    onError: (error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useUpdatePatient] failed:", error.message);
      }
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deletePatient,

    onSuccess: (_, deletedPatientId) => {
      queryClient.removeQueries({
        queryKey: patientKeys.detail(deletedPatientId),
      });

      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },

    onError: (error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useDeletePatient] failed:", error.message);
      }
    },
  });
}