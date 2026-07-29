import { tenantHttp } from "@/src/lib/api/http";
import type {
  CreateDentalImagePayload,
  DentalImage,
  UploadedStorageFile,
} from "@/src/types/dental-image.types";

const DENTAL_IMAGES_ENDPOINT = "/api/dental/images";

/**
 * Dental Image metadata'sini bazaga saqlaydi.
 *
 * Rasm avval storage endpoint'ga yuklangan bo‘lishi kerak.
 */
export async function createDentalImage(
  payload: CreateDentalImagePayload
): Promise<DentalImage> {
  const http = tenantHttp();

  const response = await http.post<DentalImage>(
    DENTAL_IMAGES_ENDPOINT,
    payload
  );

  return response.data;
}

/**
 * Bir nechta rasm metadata'sini parallel yaratadi.
 */
export async function createDentalImages(
  payloads: CreateDentalImagePayload[]
): Promise<DentalImage[]> {
  if (payloads.length === 0) {
    return [];
  }

  return Promise.all(payloads.map(createDentalImage));
}

/**
 * Storage upload response ichidan public URL'ni topadi.
 *
 * /api/dental/images endpointidagi `s3Url` maydoniga aynan shu qiymat ketadi.
 */
export function getUploadedFileUrl(file: UploadedStorageFile): string {
  const candidates = [
    file.s3Url,
    file.url,
    file.fileUrl,
    file.publicUrl,
    file.storagePath,
    file.path,
  ];

  const value = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  if (!value) {
    throw new Error(
      "Storage upload response ichidan rasm URL'i topilmadi"
    );
  }

  return value.trim();
}

/**
 * Storage upload response ichidan fayl nomini topadi.
 */
export function getUploadedFileName(
  uploadedFile: UploadedStorageFile,
  originalFile?: File
): string {
  const candidates = [
    uploadedFile.fileName,
    uploadedFile.originalFileName,
    uploadedFile.name,
    originalFile?.name,
  ];

  const value = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  return value?.trim() || "xray-image";
}

/**
 * addVisit() response ichidan appointmentId topadi.
 *
 * Backend response har xil wrapper bilan qaytsa ham ishlaydi:
 * - response.appointmentId
 * - response.visit.appointmentId
 * - response.data.appointmentId
 * - response.data.visit.appointmentId
 * - response.course.visits[last].appointmentId
 */
export function getAppointmentIdFromVisitResponse(
  response: unknown
): string {
  const data = response as any;

  const directCandidates = [
    data?.appointmentId,
    data?.visit?.appointmentId,
    data?.data?.appointmentId,
    data?.data?.visit?.appointmentId,
    data?.result?.appointmentId,
    data?.result?.visit?.appointmentId,
  ];

  const directValue = directCandidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  if (directValue) {
    return directValue.trim();
  }

  const visitArrays = [
    data?.visits,
    data?.course?.visits,
    data?.data?.visits,
    data?.data?.course?.visits,
    data?.result?.visits,
    data?.result?.course?.visits,
  ];

  for (const visits of visitArrays) {
    if (!Array.isArray(visits) || visits.length === 0) {
      continue;
    }

    const lastVisit = visits[visits.length - 1];
    const appointmentId = lastVisit?.appointmentId;

    if (
      typeof appointmentId === "string" &&
      appointmentId.trim().length > 0
    ) {
      return appointmentId.trim();
    }
  }

  return "";
}
