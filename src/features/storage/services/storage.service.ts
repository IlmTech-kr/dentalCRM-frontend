import {
  AxiosHeaders,
  type AxiosRequestConfig,
} from "axios";

import {
  getApiErrorMessage,
  tenantHttp,
} from "@/src/lib/api/http";

import {
  STORAGE_BUCKET,
  type StorageFileInfo,
  type UploadedStorageFile,
  type UploadFilePayload,
  type UploadFilesPayload,
} from "@/src/types/storage.types";

const STORAGE_ENDPOINTS = {
  upload: "/api/storage/upload",

  uploadBatch: "/api/storage/upload/batch",

  file: (
    bucket: string,
    storagePath: string
  ) =>
    `/api/storage/${encodeURIComponent(
      bucket
    )}/${encodeStoragePath(storagePath)}`,

  files: (bucket: string) =>
    `/api/storage/${encodeURIComponent(
      bucket
    )}/files`,

  info: (storagePath: string) =>
    `/api/storage/info/${encodeStoragePath(
      storagePath
    )}`,
};

type UnknownObject = Record<string, unknown>;

function isObject(
  value: unknown
): value is UnknownObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function encodeStoragePath(
  storagePath: string
): string {
  return storagePath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function safeDecodeURIComponent(
  value: string
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * FormData requestda Content-Type'ni qo‘lda yozmaslik kerak.
 *
 * Browser:
 *
 * multipart/form-data; boundary=...
 *
 * qiymatini o‘zi qo‘yadi.
 *
 * Bu funksiya http.ts ichida global
 * application/json header mavjud bo‘lsa ham uni o‘chiradi.
 */
function getMultipartConfig(): AxiosRequestConfig<FormData> {
  return {
    transformRequest: [
      (data, headers) => {
        if (headers instanceof AxiosHeaders) {
          headers.delete("Content-Type");
        } else if (headers) {
          const mutableHeaders =
            headers as unknown as Record<
              string,
              unknown
            >;

          delete mutableHeaders["Content-Type"];
          delete mutableHeaders["content-type"];
        }

        return data;
      },
    ],
  };
}

function extractStringValue(
  responseData: unknown
): string | null {
  if (typeof responseData === "string") {
    const value = responseData.trim();

    return value || null;
  }

  if (!isObject(responseData)) {
    return null;
  }

  const directKeys = [
    "storagePath",
    "fileName",
    "filename",
    "path",
    "key",
    "objectName",
    "url",
    "fileUrl",
    "downloadUrl",
  ];

  for (const key of directKeys) {
    const value = responseData[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  const nestedKeys = [
    "data",
    "result",
    "response",
  ];

  for (const key of nestedKeys) {
    const value = responseData[key];

    const nestedValue =
      extractStringValue(value);

    if (nestedValue) {
      return nestedValue;
    }
  }

  return null;
}

function normalizeStoragePath(
  rawValue: string,
  bucket: string,
  target: string,
  originalFileName: string
): string {
  let value = rawValue.trim();

  /**
   * Backend to‘liq URL qaytarsa:
   *
   * https://domain/api/storage/dental-storage/users/avatar.png
   */
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsedUrl = new URL(value);

      value = parsedUrl.pathname;
    } catch {
      // Oddiy string sifatida davom etadi.
    }
  }

  value = value.split("?")[0];
  value = value.split("#")[0];

  value = safeDecodeURIComponent(value);

  value = value.replace(/^\/+/, "");

  const marker =
    `api/storage/${bucket}/`;

  const markerIndex =
    value.indexOf(marker);

  if (markerIndex >= 0) {
    value = value.slice(
      markerIndex + marker.length
    );
  }

  if (value.startsWith(`${bucket}/`)) {
    value = value.slice(
      bucket.length + 1
    );
  }

  value = value.replace(/^\/+/, "");

  /**
   * Backend bo‘sh response qaytarsa,
   * original fileName asosida path yaratiladi.
   */
  if (!value) {
    return `${target}/${originalFileName}`;
  }

  /**
   * Backend faqat file nomini qaytarsa:
   *
   * avatar.png
   *
   * Natija:
   *
   * users/avatar.png
   */
  if (!value.includes("/")) {
    return `${target}/${value}`;
  }

  return value;
}

function normalizeUploadResult(
  responseData: unknown,
  file: File,
  target: string,
  bucket: string
): UploadedStorageFile {
  const responseValue =
    extractStringValue(responseData) ||
    `${target}/${file.name}`;

  const storagePath =
    normalizeStoragePath(
      responseValue,
      bucket,
      target,
      file.name
    );

  const fileName =
    storagePath.split("/").pop() ||
    file.name;

  return {
    storagePath,
    fileName,
    bucket,
  };
}

function extractResponseArray(
  responseData: unknown
): unknown[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (!isObject(responseData)) {
    return [];
  }

  const arrayKeys = [
    "files",
    "items",
    "data",
    "results",
  ];

  for (const key of arrayKeys) {
    const value = responseData[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

/**
 * Bitta fayl yuklash.
 *
 * POST /api/storage/upload
 *
 * form-data:
 * file   = binary
 * target = users
 * bucket = dental-storage
 */
export async function uploadFile(
  payload: UploadFilePayload
): Promise<UploadedStorageFile> {
  try {
    const http = tenantHttp();

    const bucket =
      payload.bucket || STORAGE_BUCKET;

    const formData = new FormData();

    formData.append(
      "file",
      payload.file,
      payload.file.name
    );

    formData.append(
      "target",
      payload.target
    );

    formData.append(
      "bucket",
      bucket
    );

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "Storage upload request:",
        {
          fileName: payload.file.name,
          fileType: payload.file.type,
          fileSize: payload.file.size,
          target: payload.target,
          bucket,
        }
      );
    }

    const response =
      await http.post<unknown>(
        STORAGE_ENDPOINTS.upload,
        formData,
        getMultipartConfig()
      );

    return normalizeUploadResult(
      response.data,
      payload.file,
      payload.target,
      bucket
    );
  } catch (error) {
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.error(
        "Storage upload failed:",
        error
      );
    }

    throw new Error(
      getApiErrorMessage(error)
    );
  }
}

/**
 * Bir nechta fayl yuklash.
 *
 * POST /api/storage/upload/batch
 *
 * form-data:
 * files  = binary
 * files  = binary
 * target = documents
 * bucket = dental-storage
 */
export async function uploadFiles(
  payload: UploadFilesPayload
): Promise<UploadedStorageFile[]> {
  try {
    const http = tenantHttp();

    const bucket =
      payload.bucket || STORAGE_BUCKET;

    const formData = new FormData();

    payload.files.forEach((file) => {
      formData.append(
        "files",
        file,
        file.name
      );
    });

    formData.append(
      "target",
      payload.target
    );

    formData.append(
      "bucket",
      bucket
    );

    const response =
      await http.post<unknown>(
        STORAGE_ENDPOINTS.uploadBatch,
        formData,
        getMultipartConfig()
      );

    const uploadedItems =
      extractResponseArray(response.data);

    return payload.files.map(
      (file, index) =>
        normalizeUploadResult(
          uploadedItems[index],
          file,
          payload.target,
          bucket
        )
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error)
    );
  }
}

/**
 * Storage faylni Blob qilib olish.
 *
 * GET:
 * /api/storage/dental-storage/users/avatar.png
 */
export async function getStorageFile(
  storagePath: string,
  bucket = STORAGE_BUCKET
): Promise<Blob> {
  try {
    const http = tenantHttp();

    const response =
      await http.get<Blob>(
        STORAGE_ENDPOINTS.file(
          bucket,
          storagePath
        ),
        {
          responseType: "blob",
        }
      );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error)
    );
  }
}

/**
 * Bucket ichidagi barcha fayllar.
 *
 * GET:
 * /api/storage/dental-storage/files
 */
export async function getStorageFiles(
  bucket = STORAGE_BUCKET
): Promise<StorageFileInfo[]> {
  try {
    const http = tenantHttp();

    const response =
      await http.get<StorageFileInfo[]>(
        STORAGE_ENDPOINTS.files(bucket)
      );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error)
    );
  }
}

/**
 * Bitta fayl haqida ma’lumot.
 *
 * GET:
 * /api/storage/info/users/avatar.png
 */
export async function getStorageFileInfo(
  storagePath: string
): Promise<StorageFileInfo> {
  try {
    const http = tenantHttp();

    const response =
      await http.get<StorageFileInfo>(
        STORAGE_ENDPOINTS.info(
          storagePath
        )
      );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error)
    );
  }
}