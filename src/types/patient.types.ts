import { Gender } from "../lib/enums/enums.types";

export interface Patient {
  id: string;
  _id?: string;

  tenantId?: string;

  firstName: string;
  lastName: string;
  birthDate: string;

  phone: string;
  phoneNumber?: string;

  gender: Gender;
  anamnesis: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  phoneNumber?: string;
  gender: Gender;
  anamnesis: string;
}

export interface UpdatePatientDto {
  id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  phoneNumber?: string;
  gender?: Gender;
  anamnesis?: string;
}
