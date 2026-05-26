export type Gender = "MALE" | "FEMALE";

export interface Patient {
  phoneNumber: any;
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  gender: Gender;
  anamnesis: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  gender: Gender;
  anamnesis: string;
}

export interface UpdatePatientDto extends CreatePatientDto {
  id: string;
}