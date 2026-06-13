// File: src/types/patient.types.ts

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

export interface PatientListResponse {
  data?: Patient[];
  patients?: Patient[];
  content?: Patient[];
  items?: Patient[];
  results?: Patient[];

  total?: number;
  totalElements?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
  size?: number;
}