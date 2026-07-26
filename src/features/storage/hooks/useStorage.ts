"use client";

/**
 * File:
 * src/features/storage/hooks/useStorage.ts
 */

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  useEffect,
  useState,
} from "react";

import {
  getStorageFile,
  getStorageFileInfo,
  getStorageFiles,
  uploadFile,
  uploadFiles,
} from "@/src/features/storage/services/storage.service";

import {
  STORAGE_BUCKET,
  type UploadFilePayload,
  type UploadFilesPayload,
} from "@/src/types/storage.types";

export {
  STORAGE_BUCKET,
  StorageTarget,
} from "@/src/types/storage.types";

export const storageQueryKeys = {
  all: ["storage"] as const,

  files: (bucket: string) =>
    [
      ...storageQueryKeys.all,
      "files",
      bucket,
    ] as const,

  file: (
    bucket: string,
    storagePath: string
  ) =>
    [
      ...storageQueryKeys.all,
      "file",
      bucket,
      storagePath,
    ] as const,

  info: (storagePath: string) =>
    [
      ...storageQueryKeys.all,
      "info",
      storagePath,
    ] as const,
};

function isDirectUrl(
  value?: string | null
): boolean {
  if (!value) {
    return false;
  }

  return (
    value.startsWith("blob:") ||
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (
      payload: UploadFilePayload
    ) => uploadFile(payload),
  });
}

export function useUploadFiles() {
  return useMutation({
    mutationFn: (
      payload: UploadFilesPayload
    ) => uploadFiles(payload),
  });
}

export function useStorageFiles(
  bucket = STORAGE_BUCKET
) {
  return useQuery({
    queryKey:
      storageQueryKeys.files(bucket),

    queryFn: () =>
      getStorageFiles(bucket),
  });
}

export function useStorageFileInfo(
  storagePath?: string | null
) {
  return useQuery({
    queryKey:
      storageQueryKeys.info(
        storagePath || ""
      ),

    queryFn: () =>
      getStorageFileInfo(
        storagePath!
      ),

    enabled: Boolean(storagePath),
  });
}

/**
 * Storage pathni <img> uchun blob URLga aylantiradi.
 *
 * Input:
 * users/avatar.png
 *
 * Request:
 * GET /api/storage/dental-storage/users/avatar.png
 *
 * Output:
 * blob:http://localhost:3000/...
 */
export function useStorageImage(
  storagePath?: string | null,
  bucket = STORAGE_BUCKET
) {
  const directUrl =
    isDirectUrl(storagePath);

  const query = useQuery({
    queryKey:
      storageQueryKeys.file(
        bucket,
        storagePath || ""
      ),

    queryFn: () =>
      getStorageFile(
        storagePath!,
        bucket
      ),

    enabled:
      Boolean(storagePath) &&
      !directUrl,

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [
    objectUrl,
    setObjectUrl,
  ] = useState("");

  useEffect(() => {
    if (!query.data) {
      setObjectUrl("");
      return;
    }

    const nextObjectUrl =
      URL.createObjectURL(query.data);

    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(
        nextObjectUrl
      );
    };
  }, [query.data]);

  return {
    ...query,

    url: directUrl
      ? storagePath || ""
      : objectUrl,
  };
}