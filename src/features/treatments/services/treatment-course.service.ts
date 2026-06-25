/**
 * File: src/features/treatments/services/treatment-course.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  AddTreatmentVisitDto,
  CreateTreatmentCourseDto,
  TreatmentCourse,
} from "@/src/types/treatment-course.types";

function normalizeCourse(course: any): TreatmentCourse {
  return {
    ...course,
    id: course.id || course._id,
    visits: Array.isArray(course.visits) ? course.visits : [],
  };
}

function normalizeCourseList(data: any): TreatmentCourse[] {
  if (Array.isArray(data)) return data.map(normalizeCourse);
  if (Array.isArray(data?.content)) return data.content.map(normalizeCourse);
  if (Array.isArray(data?.data)) return data.data.map(normalizeCourse);
  return [];
}

export const treatmentCourseService = {
  async create(payload: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    try {
      const { data } = await tenantHttp().post(
        ENDPOINTS.dental.treatmentCourses.create,
        payload
      );
      return normalizeCourse(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[TreatmentCourse] create failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async addVisit(courseId: string, payload: AddTreatmentVisitDto): Promise<TreatmentCourse> {
    try {
      const { data } = await tenantHttp().post(
        ENDPOINTS.dental.treatmentCourses.addVisit(courseId),
        payload
      );
      return normalizeCourse(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[TreatmentCourse] addVisit failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async complete(courseId: string): Promise<TreatmentCourse> {
    try {
      const { data } = await tenantHttp().post(
        ENDPOINTS.dental.treatmentCourses.complete(courseId)
      );
      return normalizeCourse(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[TreatmentCourse] complete failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async getById(courseId: string): Promise<TreatmentCourse> {
    try {
      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.treatmentCourses.getById(courseId)
      );
      return normalizeCourse(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[TreatmentCourse] getById failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async listByPatient(patientId: string): Promise<TreatmentCourse[]> {
    try {
      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.treatmentCourses.listByPatient(patientId)
      );
      return normalizeCourseList(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[TreatmentCourse] listByPatient failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },
};