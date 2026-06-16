// File: src/types/doctor-schedule.types.ts

import { DayOfWeek } from "../lib/enums/enums.types";

export interface DoctorScheduleDay {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
  slotDurationMinutes?: number;
}

export interface DoctorSchedule {
  _id?: string;
  id?: string;
  tenantId?: string;
  doctorId: string;

  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  active?: boolean;
  slotDurationMinutes?: number;

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
  slotDurationMinutes?: number;
}

export interface DoctorScheduleListParams {
  page?: number;
  limit?: number;
}