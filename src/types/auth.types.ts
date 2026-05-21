export type UserRole =
  | "SUPER_ADMIN"
  | "CLINIC_ADMIN"
  | "DOCTOR"
  | "ASSISTANT";

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
  role: "DOCTOR" | "ASSISTANT" | "CLINIC_ADMIN";
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
  firstName: string;
  lastName: string;
  email: string;
  roles: UserRole[];
  avatarUrl?: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}