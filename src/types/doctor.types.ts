// File: src/types/doctor.types.ts

import { Role, UserStatus } from "../lib/enums/enums.types";

export type StaffRole = Role.DOCTOR | Role.RECEPTIONIST | Role.ASSISTANT;

export type DoctorRole = StaffRole;

export type DoctorStatus =
  | UserStatus.ACTIVE
  | UserStatus.BLOCKED
  | UserStatus.PENDING
  | UserStatus.DELETED;

export interface Doctor {
  id: string;
  _id?: string;

  firstName: string;
  lastName: string;
  email: string;

  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;

  roles: StaffRole[];
  status: DoctorStatus;

  tenantId?: string;
  clinicId?: string;

  createdAt?: string;
  updatedAt?: string;
}


export interface UpdateDoctorDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  roles: StaffRole[];
  status: DoctorStatus;
}

export interface DoctorListResponse {
  data?: Doctor[];
  users?: Doctor[];
  content?: Doctor[];
  items?: Doctor[];
  results?: Doctor[];

  total?: number;
  totalElements?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
  size?: number;
}

export type CompensationType = "PERCENTAGE" | "SALARY";

export interface InviteDoctorDto {
  email: string;
  role: StaffRole;
  compensationType?: CompensationType;
  commissionPercentage?: number;
}