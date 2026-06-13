// File: src/types/auth.types.ts

import { Role, UserStatus } from "../lib/enums/enums.types";

export interface RegisterClinicDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  clinicName: string;
  subDomain: string;
}

export interface LoginDto {
  email: string;
  password: string;
  subDomain: string;
}

export interface InviteUserDto {
  email: string;
  role: Role.DOCTOR | Role.ASSISTANT | Role.CLINIC_ADMIN | Role.RECEPTIONIST;
  subDomain: string;
}

export interface ForgotPasswordDto {
  email: string;
  subDomain: string;
}

export interface ResetPasswordDto {
  confirmPassword: string;
  token: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  _id?: string;

  firstName: string;
  lastName: string;
  email: string;

  roles: Role[];

  avatarUrl?: string;
  status?: UserStatus;

  clinicId?: string;
  tenantId?: string;

  createdAt?: string;
  updatedAt?: string;
}