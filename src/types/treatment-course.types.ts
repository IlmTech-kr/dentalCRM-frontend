import { AppointmentStatus } from "../lib/enums/enums.types";

export interface TreatmentVisitItem {
  itemId?: string;
  revision?: number;
  provenanceVersion?: number;
  toothNumber: string;
  procedureId: string;

  /**
   * Frontend visit yaratishda yuboradigan narx.
   */
  price: number;

  /**
   * Backend response'da snapshot nomi bilan ham qaytishi mumkin.
   */
  priceSnapshot?: number;
  procedureNameSnapshot?: string;

  completed: boolean;
  note: string | null;
}

/**
 * Backend visit ichida qaytaradigan rasm metadata'si.
 */
export interface TreatmentVisitImage {
  id?: string;
  _id?: string;

  patientId?: string;
  appointmentId?: string;

  toothNumber?: string;
  imageType?: "XRAY" | string;

  /**
   * Backend response'dagi to‘liq S3/B2 URL.
   */
  s3Url: string;

  fileName?: string;
  notes?: string | null;

  uploadedByDoctorId?: string;
  uploadedAt?: string;
}

export interface TreatmentVisit {
  visitId?: string;
  revision?: number;
  provenanceVersion?: number;
  appointmentId?: string;
  visitDate: string;
  doctorId: string;
  doctorNotes: string;

  items: TreatmentVisitItem[];

  /**
   * Yangi backend response formati:
   *
   * images: [
   *   {
   *     imageType: "XRAY",
   *     s3Url: "https://s3.../file.png"
   *   }
   * ]
   */
  images?: TreatmentVisitImage[];

  /**
   * Eski frontend/backend formatlari bilan moslik uchun.
   */
  xrayUrls?: string[];
  radiographUrls?: string[];
  xrays?: Array<string | TreatmentVisitImage>;

  totalPrice?: number;
  totalAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentCourse {
  _id?: string;
  id?: string;

  tenantId?: string;
  patientId: string;

  mainDiagnosis: string;
  currency?: string;

  startDate?: string;
  endDate?: string | null;

  status: AppointmentStatus;

  totalCoursePrice?: number;
  invoiceGenerated?: boolean;
  version?: number;

  visits: TreatmentVisit[];

  createdAt?: string;
  updatedAt?: string;
  _class?: string;
}

export interface CreateTreatmentCourseDto {
  patientId: string;
  mainDiagnosis: string;
  currency: string;
}

/**
 * appointmentId ixtiyoriy:
 * - Bo‘lsa, mavjud appointmentga visit biriktiriladi.
 * - Bo‘lmasa, backend appointmentni avtomatik yaratadi.
 *
 * Rentgen yuklash ham ixtiyoriy.
 * Frontend avval storage'ga yuklaydi va storage pathlarni xrayUrls bilan yuboradi.
 * Backend response'da ular `images` objectlari sifatida qaytishi mumkin.
 */
export interface AddTreatmentVisitDto {
  appointmentId?: string;
  visitDate: string;
  doctorId: string;
  doctorNotes: string;
  items: TreatmentVisitItem[];
  xrayUrls?: string[];
}
