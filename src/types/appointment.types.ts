export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | string;

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

  patient?: any;
  doctor?: any;

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
  appointments?: Appointment[];
  content?: Appointment[];
  items?: Appointment[];
  results?: Appointment[];
  total?: number;
  totalElements?: number;
}