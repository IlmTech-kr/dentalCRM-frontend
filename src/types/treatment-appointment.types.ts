export type AppointmentStatus =
  | "PENDING"
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface AppointmentUserRef {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface TreatmentAppointment {
  id?: string;
  _id?: string;

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

  reason?: string;
  notes?: string;
  complaint?: string;

  [key: string]: any;
}