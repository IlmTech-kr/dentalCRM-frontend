// File: src/types/treatment-course.types.ts

import { AppointmentStatus } from "../lib/enums/enums.types";

/**
 * Visit davomida bajarilgan bitta muolaja.
 */
export interface TreatmentVisitItem {
  toothNumber: string;
  procedureId: string;
  price: number;
  completed: boolean;
  note: string;
}

/**
 * Davolash kursidagi bitta visit.
 */
export interface TreatmentVisit {
  id?: string;
  _id?: string;

  /**
   * Mavjud appointment ID.
   *
   * Visit appointment orqali ochilgan bo‘lsa oldindan mavjud bo‘ladi.
   * "Muolajani hoziroq boshlash" oqimida backend appointment yaratib,
   * response ichida appointmentId qaytarishi mumkin.
   */
  appointmentId?: string;

  visitDate: string;
  doctorId: string;
  doctorNotes: string;

  items: TreatmentVisitItem[];

  /**
   * Rentgen rasmlarining storage pathlari.
   * Rentgen yuklash majburiy emas.
   *
   * Misol:
   * [
   *   "documents/xray-before.png",
   *   "documents/xray-after.png"
   * ]
   */
  xrayUrls?: string[];

  /**
   * Backend hisoblab qaytarishi mumkin bo‘lgan visit summalari.
   */
  totalPrice?: number;
  totalAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Bemorning davolash kursi.
 */
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

/**
 * Yangi davolash kursini yaratish payloadi.
 */
export interface CreateTreatmentCourseDto {
  patientId: string;
  mainDiagnosis: string;
}

/**
 * Davolash kursiga yangi visit qo‘shish payloadi.
 *
 * appointmentId ixtiyoriy:
 * - Bo‘lsa, visit mavjud appointmentga biriktiriladi.
 * - Bo‘lmasa, backend doctorId va visitDate asosida appointment yaratadi.
 *
 * xrayUrls ham ixtiyoriy:
 * - Rentgen tanlanmasa yuborilmaydi.
 * - Tanlansa, rasmlar avval storage endpointga yuklanadi va qaytgan
 *   storage pathlar xrayUrls ichida yuboriladi.
 */
export interface AddTreatmentVisitDto {
  appointmentId?: string;

  visitDate: string;
  doctorId: string;
  doctorNotes: string;

  items: TreatmentVisitItem[];

  xrayUrls?: string[];
}