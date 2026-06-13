// File: src/types/doctor.types.ts

import { Role, UserStatus } from "../lib/enums/enums.types";

export type DoctorRole = Role.DOCTOR;

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

  roles: DoctorRole[];
  status: DoctorStatus;

  tenantId?: string;
  clinicId?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface InviteDoctorDto {
  email: string;
  role: Role.DOCTOR;
}

export interface UpdateDoctorDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  roles: [Role.DOCTOR];
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