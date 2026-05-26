// File: src/types/appointment.types.ts

export interface Appointment {
  id: string;

  patientId: string;
  doctorId: string;

  appointmentDate: string;
  startTime: string;
  slotDurationMinutes: number;

  notes?: string;
  status?: AppointmentStatus;

  createdAt?: string;
  updatedAt?: string;

  patient?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };

  doctor?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  slotDurationMinutes: number;
  notes?: string;
}

export interface UpdateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  slotDurationMinutes: number;
  notes?: string;
}

export interface AppointmentListResponse {
  data?: Appointment[];
  content?: Appointment[];
  appointments?: Appointment[];
  total?: number;
  page?: number;
  limit?: number;
}