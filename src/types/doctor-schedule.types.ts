export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorScheduleDay {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface DoctorSchedule {
  _id?: string;
  id?: string;
  tenantId?: string;
  doctorId: string;

  // Ba'zi backendlarda schedule bitta day sifatida kelishi mumkin
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  active?: boolean;
  slotDurationMinutes?: number;

  // Siz ko'rsatgan MongoDB response'da days array bor
  days?: DoctorScheduleDay[];

  doctor?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorSchedulePayload {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
  slotDurationMinutes?: number;
}

export interface UpdateDoctorSchedulePayload {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
  slotDurationMinutes?: number;
}

export interface WeeklyDoctorSchedulePayload {
  doctorId: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface DoctorScheduleListParams {
  page?: number;
  limit?: number;
}