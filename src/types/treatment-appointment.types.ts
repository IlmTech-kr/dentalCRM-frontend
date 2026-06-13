// File: src/types/treatment-appointment.types.ts

import { AppointmentStatus } from "../lib/enums/enums.types";

export interface AppointmentUserRef {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
}

export interface TreatmentAppointment {
  id?: string;
  _id?: string;

  tenantId?: string;

  patientId?: string;
  patient?: AppointmentUserRef;

  doctorId?: string;
  doctor?: AppointmentUserRef;

  status?: AppointmentStatus;

  appointmentDate?: string;
  date?: string;
  visitDate?: string;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;

  slotDurationMinutes?: number;

  reason?: string;
  notes?: string;
  complaint?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}