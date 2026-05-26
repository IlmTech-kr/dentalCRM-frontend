// File: src/types/doctor-schedule.types.ts

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorSchedule {
  id: string;
  doctorId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;

  doctor?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface CreateDoctorScheduleDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

export interface UpdateDoctorScheduleDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

export interface DoctorScheduleListResponse {
  data?: DoctorSchedule[];
  content?: DoctorSchedule[];
  schedules?: DoctorSchedule[];
  total?: number;
  page?: number;
  limit?: number;
}