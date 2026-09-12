"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, ImageIcon } from "lucide-react";

import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { useStorageImage } from "@/src/features/storage/hooks/useStorage";
import { STORAGE_BUCKET } from "@/src/types/storage.types";
import type { TreatmentVisit } from "@/src/types/treatment-course.types";

export type VisitImage = {
  id?: string;
  _id?: string;
  patientId?: string;
  appointmentId?: string;
  toothNumber?: string;
  imageType?: string;
  s3Url: string;
  fileName?: string;
  notes?: string | null;
  uploadedByDoctorId?: string;
  uploadedAt?: string;
  createdAt?: string;
};

function isDirectImageUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  );
}

function isBackblazeImageUrl(value: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);

    return (
      url.hostname === "backblazeb2.com" ||
      url.hostname.endsWith(".backblazeb2.com")
    );
  } catch {
    return false;
  }
}

function normalizeImageSource(value: string): string {
  const source = value.trim();

  if (!source) return "";

  try {
    const url = new URL(source);

    const isBackblazeS3 =
      url.hostname.startsWith("s3.") &&
      url.hostname.endsWith(".backblazeb2.com");

    if (isBackblazeS3 && url.pathname.startsWith("/file/")) {
      url.pathname = url.pathname.replace(/^\/file\//, "/");
    }

    return url.toString();
  } catch {
    return source;
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getStoragePathFromImageSource(value: string): string {
  const source = value.trim();

  if (!source) return "";

  if (!isDirectImageUrl(source)) {
    return source
      .replace(/^\/+/, "")
      .replace(new RegExp(`^${STORAGE_BUCKET}/`), "");
  }

  try {
    const url = new URL(source);
    const decodedPath = safeDecodeURIComponent(url.pathname).replace(/^\/+/, "");

    const nativePrefix = `file/${STORAGE_BUCKET}/`;
    const s3Prefix = `${STORAGE_BUCKET}/`;

    if (decodedPath.startsWith(nativePrefix)) {
      return decodedPath.slice(nativePrefix.length);
    }

    if (decodedPath.startsWith(s3Prefix)) {
      return decodedPath.slice(s3Prefix.length);
    }

    return "";
  } catch {
    return "";
  }
}

function formatImageDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}, ${hour}:${minute}`;
}

/**
 * Visit ichidagi rasmlarni normalize qiladi — yangi backend formati
 * (`images: [{ s3Url, imageType, ... }]`) va eski formatlar
 * (`xrayUrls`/`radiographUrls`/`xrays`, string yoki object) ikkalasini
 * ham qo'llab-quvvatlaydi.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeRawImage(item: unknown, index: number): VisitImage | null {
  if (typeof item === "string") {
    const source = item.trim();
    return source ? { id: `${source}-${index}`, s3Url: source, imageType: "XRAY" } : null;
  }

  const record = toRecord(item);
  if (!record) return null;

  const source = pickString(record, ["s3Url", "url", "fileUrl", "storagePath", "path"]);
  if (!source) return null;

  return {
    id: pickString(record, ["id", "_id"]) || `${source}-${index}`,
    _id: pickOptionalString(record, "_id"),
    patientId: pickOptionalString(record, "patientId"),
    appointmentId: pickOptionalString(record, "appointmentId"),
    toothNumber: pickOptionalString(record, "toothNumber"),
    imageType: pickString(record, ["imageType"]) || "XRAY",
    s3Url: source,
    fileName: pickOptionalString(record, "fileName"),
    notes: pickOptionalString(record, "notes") ?? null,
    uploadedByDoctorId: pickOptionalString(record, "uploadedByDoctorId"),
    uploadedAt: pickOptionalString(record, "uploadedAt"),
    createdAt: pickOptionalString(record, "createdAt"),
  };
}

export function getVisitImages(visit: TreatmentVisit): VisitImage[] {
  const newImages = Array.isArray(visit?.images) ? visit.images : [];

  const normalizedNewImages = newImages
    .map((item, index) => normalizeRawImage(item, index))
    .filter((item): item is VisitImage => Boolean(item));

  if (normalizedNewImages.length > 0) return normalizedNewImages;

  const oldImages = visit.xrayUrls ?? visit.radiographUrls ?? visit.xrays ?? [];

  if (!Array.isArray(oldImages)) return [];

  return oldImages
    .map((item, index) => normalizeRawImage(item, index))
    .filter((item): item is VisitImage => Boolean(item));
}

function VisitXrayImage({ image, index }: { image: VisitImage; index: number }) {
  const t = useTranslations("treatments");
  const rawSource = String(image.s3Url || "").trim();
  const source = normalizeImageSource(rawSource);
  const direct = isDirectImageUrl(source);

  /**
   * Eski recordlarda to'liq Backblaze URL saqlangan bo'lishi mumkin.
   * Undan storage key ajratib olinadi va direct URL ishlamasa
   * authenticated storage endpoint orqali Blob URL olinadi.
   */
  const storagePath = getStoragePathFromImageSource(source);
  const storageImage = useStorageImage(storagePath, STORAGE_BUCKET);

  const [directImageFailed, setDirectImageFailed] = useState(false);
  // `source` o'zgarganda oldingi rasmning xato holati saqlanib qolmasin —
  // effect o'rniga render vaqtida tiklanadi (React'ning tavsiya etilgan
  // "adjusting state when a prop changes" naqshi).
  const [trackedSource, setTrackedSource] = useState(source);
  if (source !== trackedSource) {
    setTrackedSource(source);
    setDirectImageFailed(false);
  }

  /**
   * Backblaze bucket private bo'lishi mumkin. Shuning uchun Backblaze URL
   * bo'lsa public URL'ni sinamasdan storage endpoint orqali ochamiz.
   */
  const shouldUseStorageFirst = !direct || isBackblazeImageUrl(source);

  const useStorageFallback = shouldUseStorageFirst || directImageFailed;

  const imageUrl = useStorageFallback ? storageImage.url : source;

  const isLoading =
    useStorageFallback && Boolean(storagePath) && storageImage.isFetching && !imageUrl;

  const hasError = useStorageFallback && (!storagePath || storageImage.isError) && !imageUrl;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex aspect-video items-center justify-center bg-slate-100">
          <DentalLoaderIcon size={24} className="text-primary-blue" />
        </div>

        <div className="p-3">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!imageUrl || hasError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">
        <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-red-50 px-4 text-center">
          <ImageIcon size={25} className="text-red-400" />

          <p className="text-xs font-bold text-red-600">
            {t("patientDetail.visitHistory.xrayFailed")}
          </p>

          {source ? (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 underline"
            >
              {t("patientDetail.visitHistory.checkOriginalUrl")}
            </a>
          ) : null}
        </div>

        <div className="space-y-1 p-3">
          <p className="truncate text-xs font-bold text-slate-700">
            {image.fileName ||
              t("patientDetail.visitHistory.xrayFallbackName", { number: index + 1 })}
          </p>

          {storagePath ? (
            <p title={storagePath} className="truncate text-[10px] text-slate-400">
              {storagePath}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <a
        href={imageUrl}
        target="_blank"
        rel="noreferrer"
        className="group relative block bg-slate-950"
      >
        <img
          src={imageUrl}
          alt={
            image.fileName ||
            t("patientDetail.visitHistory.xrayFallbackName", { number: index + 1 })
          }
          loading="lazy"
          onError={() => {
            /**
             * Faqat oddiy direct URL ishlamasa storage fallback'ga o'tamiz.
             * Backblaze URL allaqachon storage orqali ochiladi.
             */
            if (direct && !shouldUseStorageFirst && !directImageFailed) {
              setDirectImageFailed(true);
            }
          }}
          className="aspect-video h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/30">
          <ExternalLink
            size={20}
            className="text-white opacity-0 transition group-hover:opacity-100"
          />
        </div>
      </a>

      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs font-black text-slate-950">
            {image.fileName ||
              t("patientDetail.visitHistory.xrayFallbackName", { number: index + 1 })}
          </p>

          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
            {image.imageType || "XRAY"}
          </span>
        </div>

        {image.toothNumber ? (
          <p className="text-xs font-semibold text-primary-blue">
            {t("patientDetail.visitHistory.itemTooth", { tooth: image.toothNumber })}
          </p>
        ) : null}

        {image.notes ? <p className="text-xs leading-relaxed text-slate-500">{image.notes}</p> : null}

        {image.uploadedAt || image.createdAt ? (
          <p className="text-[11px] text-slate-400">
            {formatImageDateTime(image.uploadedAt || image.createdAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function VisitXrayGallery({ images }: { images: VisitImage[] }) {
  const t = useTranslations("treatments");

  if (!images.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon size={15} className="text-primary-blue" />
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">
          {t("patientDetail.visitHistory.xrayTitle")}
        </p>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
          {t("patientDetail.visitHistory.xrayCount", { count: images.length })}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <VisitXrayImage
            key={image.id || image._id || `${image.s3Url}-${index}`}
            image={image}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
