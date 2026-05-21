// File: src/features/patients/hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  getPatients,
  getPatientById,
  searchPatientByPhone,
  createPatient,
  updatePatient,
  deletePatient,
} from '../patient.service';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '@/src/types/patient.types';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: string) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (phone: string) => [...patientKeys.all, 'search', phone] as const,
};

/**
 * Hook: Get all patients
 */
export function useGetPatients() {
  return useQuery<Patient[], AxiosError>({
    queryKey: patientKeys.lists(),
    queryFn: () => getPatients(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });
}

/**
 * Hook: Get single patient by ID
 */
export function useGetPatient(patientId: string | null) {
  return useQuery<Patient, AxiosError>({
    queryKey: patientId ? patientKeys.detail(patientId) : ['patient-disabled'],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return getPatientById(patientId);
    },
    enabled: !!patientId, // Only run if patientId exists
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook: Search patients by phone
 */
export function useSearchPatientByPhone(phone: string | null) {
  return useQuery<Patient[], AxiosError>({
    queryKey: phone ? patientKeys.search(phone) : ['search-disabled'],
    queryFn: () => {
      if (!phone) return [];
      return searchPatientByPhone(phone);
    },
    enabled: !!phone && phone.length > 0,
    staleTime: 1000 * 60 * 3, // 3 minutes for search results
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook: Create patient
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, AxiosError, CreatePatientDto>({
    mutationFn: (payload) => createPatient(payload),
    onSuccess: (newPatient) => {
      // Invalidate the patients list to refetch
      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });

      // Optionally add the new patient to cache
      queryClient.setQueryData(
        patientKeys.detail(newPatient.id),
        newPatient
      );
    },
    onError: (error) => {
      console.error('Failed to create patient:', error);
    },
  });
}

/**
 * Hook: Update patient
 */
export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation<Patient, AxiosError, UpdatePatientDto>({
    mutationFn: (payload) => updatePatient(patientId, payload),
    onSuccess: (updatedPatient) => {
      // Update the specific patient in cache
      queryClient.setQueryData(
        patientKeys.detail(patientId),
        updatedPatient
      );

      // Invalidate the patients list
      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Failed to update patient:', error);
    },
  });
}

/**
 * Hook: Delete patient
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (patientId) => deletePatient(patientId),
    onSuccess: (_, deletedPatientId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: patientKeys.detail(deletedPatientId),
      });

      // Invalidate the list
      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Failed to delete patient:', error);
    },
  });
}