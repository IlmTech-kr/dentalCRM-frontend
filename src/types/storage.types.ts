export const STORAGE_BUCKET = "dental-storage";

export enum StorageTarget {
  USERS = "users",
  DOCUMENTS = "documents",
}

export interface UploadFilePayload {
  file: File;
  target: StorageTarget;
  bucket?: string;
}

export interface UploadFilesPayload {
  files: File[];
  target: StorageTarget;
  bucket?: string;
}

export interface UploadedStorageFile {
  /**
   * Misol:
   * users/avatar.png
   */
  storagePath: string;

  fileName: string;
  bucket: string;
}

export interface StorageFileInfo {
  fileName: string;
  etag: string;
  contentLength: number;
  uploadTimestamp: number;
}