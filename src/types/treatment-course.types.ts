export type TreatmentCourseStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | string;

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
  status: TreatmentCourseStatus;
  totalCoursePrice?: number;
  invoiceGenerated?: boolean;
  visits: TreatmentVisit[];
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