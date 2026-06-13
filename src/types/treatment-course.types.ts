// File: src/types/treatment-course.types.ts

import { AppointmentStatus } from "../lib/enums/enums.types";

export interface TreatmentVisitItem {
  toothNumber: string;
  procedureId: string;
  price: number;
  completed: boolean;
  note: string;
}

export interface TreatmentVisit {
  appointmentId: string;
  visitDate: string;
  doctorId: string;
  doctorNotes: string;
  items: TreatmentVisitItem[];
}

export interface TreatmentCourse {
  _id: string;
  id?: string;

  tenantId?: string;
  patientId: string;

  mainDiagnosis: string;

  startDate?: string;
  endDate?: string;

  status: AppointmentStatus;

  totalCoursePrice?: number;
  invoiceGenerated?: boolean;

  visits: TreatmentVisit[];

  createdAt?: string;
  updatedAt?: string;
  _class?: string;
}

export interface CreateTreatmentCourseDto {
  patientId: string;
  mainDiagnosis: string;
}

export interface AddTreatmentVisitDto {
  appointmentId: string;
  visitDate: string;
  doctorId: string;
  doctorNotes: string;
  items: TreatmentVisitItem[];
}