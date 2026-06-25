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
}

export interface InviteUserDto {
  email: string;
  role: Role.DOCTOR | Role.ASSISTANT | Role.CLINIC_ADMIN | Role.RECEPTIONIST;
  subDomain: string;
}

/**
 * Hozir tenant URL'dan olinayotgan bo‘lsa,
 * forgot password body ichida subDomain shart emas.
 *
 * Agar backend hali subDomain talab qilsa, optional qoldiramiz.
 */
export interface ForgotPasswordDto {
  email: string;
  subDomain?: string;
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
  phoneNumber?: string;
  status?: UserStatus;

  clinicId?: string;
  tenantId?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface AuthClinic {
  id: string;
  _id?: string;

  name: string;
  subDomain: string;
  ownerId?: string;

  status?: string;
  subscriptionStatus?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Login response backenddan shunday kelyapti:
 *
 * {
 *   accessToken: "...",
 *   refreshToken: null,
 *   tenantId: "...",
 *   clinic: {...},
 *   user: {...}
 * }
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string | null;

  tenantId: string;

  clinic: AuthClinic;
  user: AuthUser;
}