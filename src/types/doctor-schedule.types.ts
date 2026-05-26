export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorSchedule {
  id?: string;
  _id?: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorSchedulePayload {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

export interface UpdateDoctorSchedulePayload {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

export type DoctorScheduleFormValues = UpdateDoctorSchedulePayload;

export interface DoctorSchedulesResponse {
  schedules?: DoctorSchedule[];
  content?: DoctorSchedule[];
  data?: DoctorSchedule[];
  total?: number;
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}

export interface DoctorOption {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  specialization?: string;
}