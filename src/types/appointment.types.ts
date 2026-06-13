// File: src/types/appointment.types.ts

import { AppointmentStatus } from "../lib/enums/enums.types";

export interface AppointmentPatient {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  anamnesis?: string;
}

export interface AppointmentDoctor {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Appointment {
  id?: string;
  _id?: string;

  tenantId?: string;

  patientId: string;
  doctorId: string;

  appointmentDate: string;
  startTime: string;
  endTime?: string;

  slotDurationMinutes?: number;

  notes?: string;
  status?: AppointmentStatus;

  patient?: AppointmentPatient;
  doctor?: AppointmentDoctor;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  slotDurationMinutes: number;
  notes?: string;

  // Optional because backend can set default SCHEDULED
  status?: AppointmentStatus;
}

export interface UpdateAppointmentDto {
  patientId?: string;
  doctorId?: string;
  appointmentDate?: string;
  startTime?: string;
  slotDurationMinutes?: number;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentListResponse {
  data?: Appointment[];
  appointments?: Appointment[];
  content?: Appointment[];
  items?: Appointment[];
  results?: Appointment[];

  total?: number;
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}