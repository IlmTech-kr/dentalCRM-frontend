"use client";

/**
 * File: src/features/treatments/hooks/useTreatmentCourses.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import { treatmentCourseService } from "../services/treatment-course.service";
import type {
  AddTreatmentVisitDto,
  CreateTreatmentCourseDto,
} from "@/src/types/treatment-course.types";

export function useTreatmentCourses(patientId?: string) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const coursesQuery = useQuery({
    queryKey: ["treatment-courses", patientId],
    queryFn: () => treatmentCourseService.listByPatient(patientId!),
    enabled: Boolean(patientId) && isAuthenticated,
  });

  const createCourseMutation = useMutation({
    mutationFn: (payload: CreateTreatmentCourseDto) =>
      treatmentCourseService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["treatment-courses", data.patientId],
      });
    },
  });

  const addVisitMutation = useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: AddTreatmentVisitDto }) =>
      treatmentCourseService.addVisit(courseId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["treatment-courses", data.patientId],
      });
    },
  });

  const completeCourseMutation = useMutation({
    mutationFn: (courseId: string) => treatmentCourseService.complete(courseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["treatment-courses", data.patientId],
      });
    },
  });

  return {
    courses: coursesQuery.data || [],
    isLoading: coursesQuery.isLoading,
    isFetching: coursesQuery.isFetching,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch,

    createCourse: createCourseMutation.mutateAsync,
    isCreating: createCourseMutation.isPending,

    addVisit: addVisitMutation.mutateAsync,
    isAddingVisit: addVisitMutation.isPending,

    completeCourse: completeCourseMutation.mutateAsync,
    isCompleting: completeCourseMutation.isPending,
  };
}