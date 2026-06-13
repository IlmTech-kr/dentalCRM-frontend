// File: src/types/enums.types.ts

// =========================
// Subscription Enums
// =========================

export enum PlanType {
  START = "START",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
}

// =========================
// Auth / Clinic Enums
// =========================

export enum ClinicStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  INACTIVE = "INACTIVE",
}

export enum InviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLINIC_ADMIN = "CLINIC_ADMIN",
  DOCTOR = "DOCTOR",
  RECEPTIONIST = "RECEPTIONIST",
  ASSISTANT = "ASSISTANT",
  PATIENT = "PATIENT",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  PENDING = "PENDING",
  DELETED = "DELETED",
}

// =========================
// Dental Enums
// =========================

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum DentalImageType {
  PANORAMIC = "PANORAMIC",
  PERIAPICAL = "PERIAPICAL",
  CT_SCAN = "CT_SCAN",
  INTRAORAL_PHOTO = "INTRAORAL_PHOTO",
  XRAY = "XRAY",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum ToothCondition {
  HEALTHY = "HEALTHY",
  CARIES = "CARIES",
  EXTRACTED = "EXTRACTED",
  PULPITIS = "PULPITIS",
  FILLING = "FILLING",
  CROWN = "CROWN",
  IMPLANT = "IMPLANT",
  MISSING = "MISSING",
  CRACK = "CRACK",
  BRIDGE = "BRIDGE",
  ROOT_CANAL = "ROOT_CANAL",
  GINGIVITIS = "GINGIVITIS",
}