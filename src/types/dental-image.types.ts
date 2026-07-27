/**
 * File: src/features/images/dental-image.types.ts
 */

export type DentalImageType =
  | "XRAY"
  | "PHOTO"
  | "BEFORE"
  | "AFTER"
  | "OTHER";

export interface CreateDentalImagePayload {
  patientId: string;
  appointmentId: string;
  toothNumber?: string;
  imageType: DentalImageType;
  s3Url: string;
  fileName: string;
  notes?: string;
}

export interface DentalImage {
  id?: string;
  _id?: string;

  tenantId?: string;
  patientId: string;
  appointmentId: string;

  toothNumber?: string;
  imageType: DentalImageType;

  s3Url: string;
  fileName: string;
  notes?: string | null;

  uploadedByDoctorId?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * useUploadFiles() mutation response ichidagi bitta fayl.
 * Backend formatlarining bir necha variantini qo‘llab-quvvatlaydi.
 */
export interface UploadedStorageFile {
  s3Url?: string;
  url?: string;
  fileUrl?: string;
  publicUrl?: string;

  storagePath?: string;
  path?: string;
  key?: string;

  fileName?: string;
  originalFileName?: string;
  name?: string;

  contentType?: string;
  size?: number;

  [key: string]: unknown;
}
