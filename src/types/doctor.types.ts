export type DoctorStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type DoctorRole = "DOCTOR";

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: DoctorRole[];
  status: DoctorStatus;
}

export interface InviteDoctorDto {
  email: string;
  role: "DOCTOR";
}

export interface UpdateDoctorDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: ["DOCTOR"];
  status: DoctorStatus;
}