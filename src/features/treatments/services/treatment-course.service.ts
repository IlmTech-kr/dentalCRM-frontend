import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  AddTreatmentVisitDto,
  CreateTreatmentCourseDto,
  TreatmentCourse,
} from "@/src/types/treatment-course.types";

function getSubdomain(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("subDomain") ||
    localStorage.getItem("subdomain") ||
    ""
  );
}

function getHttp() {
  const subDomain = getSubdomain();

  if (!subDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found",
    };
  }

  return tenantHttp(subDomain);
}

function normalizeCourse(course: any): TreatmentCourse {
  return {
    ...course,
    id: course.id || course._id,
    visits: Array.isArray(course.visits) ? course.visits : [],
  };
}

function normalizeCourseList(data: any): TreatmentCourse[] {
  if (Array.isArray(data)) {
    return data.map(normalizeCourse);
  }

  if (Array.isArray(data?.content)) {
    return data.content.map(normalizeCourse);
  }

  if (Array.isArray(data?.data)) {
    return data.data.map(normalizeCourse);
  }

  return [];
}

export const treatmentCourseService = {
  async create(payload: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    const http = getHttp();

    const { data } = await http.post(
      ENDPOINTS.dental.treatmentCourses.create,
      payload
    );

    return normalizeCourse(data);
  },

  async addVisit(
    courseId: string,
    payload: AddTreatmentVisitDto
  ): Promise<TreatmentCourse> {
    const http = getHttp();

    const { data } = await http.post(
      ENDPOINTS.dental.treatmentCourses.addVisit(courseId),
      payload
    );

    return normalizeCourse(data);
  },

  async complete(courseId: string): Promise<TreatmentCourse> {
    const http = getHttp();

    const { data } = await http.post(
      ENDPOINTS.dental.treatmentCourses.complete(courseId)
    );

    return normalizeCourse(data);
  },

  async getById(courseId: string): Promise<TreatmentCourse> {
    const http = getHttp();

    const { data } = await http.get(
      ENDPOINTS.dental.treatmentCourses.getById(courseId)
    );

    return normalizeCourse(data);
  },

  async listByPatient(patientId: string): Promise<TreatmentCourse[]> {
    const http = getHttp();

    const { data } = await http.get(
      ENDPOINTS.dental.treatmentCourses.listByPatient(patientId)
    );

    return normalizeCourseList(data);
  },
};