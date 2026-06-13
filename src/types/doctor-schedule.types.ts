// File: src/types/doctor-schedule.types.ts

import { DayOfWeek } from "../lib/enums/enums.types";

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

  // Some backend responses may return schedule as single day
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  active?: boolean;
  slotDurationMinutes?: number;

  // MongoDB response can return days array
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