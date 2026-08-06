"use client";

/**
 * Flow:
 * 1. Rentgen fayllari storage'ga yuklanadi.
 * 2. Visit yaratiladi.
 * 3. appointmentId aniqlanadi.
 * 4. Har bir rasm POST /api/dental/images orqali yaratiladi.
 * 5. Treatment course va visit query'lari yangilanadi.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit3,
  ExternalLink,
  ImageIcon,
  Lock,
  Plus,
  Save,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

import DentalLoader from "@/src/components/ui/DentalLoader";
import { Dental3DChart } from "@/src/features/treatments/components/Dental3DChart";
import { useDentalChart } from "@/src/features/treatments/hooks/useDentalChart";
import { useDentalProcedures } from "@/src/features/treatments/hooks/useDentalProcedures";
import { useTreatmentCourses } from "@/src/features/treatments/hooks/useTreatmentCourses";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { getPatientById } from "@/src/features/patients/patient.service";
import {
  useStorageImage,
  useUploadFiles,
} from "@/src/features/storage/hooks/useStorage";
import { tenantHttp } from "@/src/lib/api/http";
import { Role, ToothCondition } from "@/src/lib/enums/enums.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { useAuthStore } from "@/src/store/auth.store";
import type { ToothItem, ToothMap } from "@/src/types/dental-chart.types";
import type { DentalProcedure } from "@/src/types/dental-procedure.types";
import type { TreatmentVisitItem } from "@/src/types/treatment-course.types";
import {
  STORAGE_BUCKET,
  StorageTarget,
} from "@/src/types/storage.types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PatientInfo = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  birthDate?: string;
  dateOfBirth?: string;
  status?: string;
  active?: boolean;
};

type TreatmentTab = "CHART" | "COURSE";
type CourseStatusFilter = "ACTIVE" | "COMPLETED";

type SelectedXray = {
  id: string;
  file: File;
  previewUrl: string;
};

type VisitImage = {
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

type CreateDentalImagePayload = {
  patientId: string;
  appointmentId: string;
  toothNumber?: string;
  imageType: "XRAY" | "PHOTO" | "BEFORE" | "AFTER" | "OTHER";
  s3Url: string;
  fileName: string;
  notes?: string;
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MAX_XRAY_FILES = 10;
const MAX_XRAY_FILE_SIZE = 10 * 1024 * 1024;
const DENTAL_IMAGES_ENDPOINT = "/api/dental/images";

const DIAGNOSIS_OPTIONS: ToothCondition[] = [
  ToothCondition.CARIES,
  ToothCondition.PULPITIS,
  ToothCondition.GINGIVITIS,
  ToothCondition.CRACK,
];

const STATE_OPTIONS: ToothCondition[] = [
  ToothCondition.HEALTHY,
  ToothCondition.MISSING,
  ToothCondition.EXTRACTED,
  ToothCondition.FILLING,
  ToothCondition.CROWN,
  ToothCondition.IMPLANT,
  ToothCondition.BRIDGE,
  ToothCondition.ROOT_CANAL,
];

const CONDITION_LABELS: Record<ToothCondition, string> = {
  [ToothCondition.HEALTHY]: "Sog'lom",
  [ToothCondition.CARIES]: "Karies",
  [ToothCondition.EXTRACTED]: "Sug'urilgan",
  [ToothCondition.PULPITIS]: "Pulpit",
  [ToothCondition.FILLING]: "Plomba",
  [ToothCondition.CROWN]: "Koronka",
  [ToothCondition.IMPLANT]: "Implant",
  [ToothCondition.MISSING]: "Yo'q",
  [ToothCondition.CRACK]: "Yoriq",
  [ToothCondition.BRIDGE]: "Ko'prik",
  [ToothCondition.ROOT_CANAL]: "Kanal davolangan",
  [ToothCondition.GINGIVITIS]: "Gingivit",
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function emptyTooth(): ToothItem {
  return {
    diagnoses: [],
    states: [],
    note: "",
  };
}

function getId(item?: { id?: string; _id?: string } | null): string {
  return item?.id || item?._id || "";
}

function getFullName(
  person?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  } | null
): string {
  if (!person) return "";

  return (
    person.fullName ||
    `${person.firstName || ""} ${person.lastName || ""}`.trim()
  );
}

function getInitials(name: string): string {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMoney(value?: number): string {
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;

  const match = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function formatBirthDate(value?: string | null): string {
  const date = parseDateOnly(value);

  if (!date) return "—";

  return `${String(date.day).padStart(2, "0")}.${String(date.month).padStart(
    2,
    "0"
  )}.${date.year}`;
}

function formatPatientAge(value?: string | null): string {
  const birthDate = parseDateOnly(value);

  if (!birthDate) return "—";

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const birthTime = Date.UTC(
    birthDate.year,
    birthDate.month - 1,
    birthDate.day
  );
  const currentTime = Date.UTC(currentYear, currentMonth - 1, currentDay);

  if (birthTime > currentTime) return "—";

  let years = currentYear - birthDate.year;

  const birthdayNotPassed =
    currentMonth < birthDate.month ||
    (currentMonth === birthDate.month && currentDay < birthDate.day);

  if (birthdayNotPassed) years -= 1;

  if (years >= 1) return `${years} yosh`;

  let months =
    (currentYear - birthDate.year) * 12 +
    (currentMonth - birthDate.month);

  if (currentDay < birthDate.day) months -= 1;

  if (months >= 1) return `${months} oy`;

  const days = Math.floor((currentTime - birthTime) / 86_400_000);

  return `${Math.max(days, 0)} kun`;
}

function formatVisitDateTime(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${date.getFullYear()}, ${hour}:${minute}`;
}

function nowLocalIso(): string {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function getItemPrice(item: any): number {
  return Number(item?.priceSnapshot ?? item?.price ?? 0);
}

function getVisitTotal(visit: any): number {
  if (typeof visit?.totalPrice === "number") return visit.totalPrice;
  if (typeof visit?.totalAmount === "number") return visit.totalAmount;

  return (visit?.items || []).reduce(
    (sum: number, item: any) => sum + getItemPrice(item),
    0
  );
}

function getVisitDoctorName(
  visit: any,
  doctorsMap: Map<string, any>
): string {
  const embeddedDoctor = visit?.doctor || visit?.doctorInfo;

  if (embeddedDoctor) {
    const fullName = getFullName(embeddedDoctor);

    if (visit?.doctorName || embeddedDoctor.fullName || fullName) {
      return visit.doctorName || embeddedDoctor.fullName || fullName;
    }
  }

  const doctor = doctorsMap.get(visit?.doctorId);

  if (doctor) {
    return getFullName(doctor) || visit?.doctorId || "—";
  }

  return visit?.doctorId || "—";
}

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
    const decodedPath = safeDecodeURIComponent(url.pathname)
      .replace(/^\/+/, "");

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

function createClientId(file: File): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

function getVisitImages(visit: any): VisitImage[] {
  const newImages = Array.isArray(visit?.images) ? visit.images : [];

  const normalizedNewImages = newImages
    .map((item: any, index: number): VisitImage | null => {
      if (typeof item === "string") {
        const source = item.trim();

        return source
          ? {
              id: `${source}-${index}`,
              s3Url: source,
              imageType: "XRAY",
            }
          : null;
      }

      if (!item || typeof item !== "object") return null;

      const source = String(
        item.s3Url ??
          item.url ??
          item.fileUrl ??
          item.storagePath ??
          item.path ??
          ""
      ).trim();

      if (!source) return null;

      return {
        id: String(item.id ?? item._id ?? `${source}-${index}`),
        _id: item._id,
        patientId: item.patientId,
        appointmentId: item.appointmentId,
        toothNumber: item.toothNumber,
        imageType: item.imageType || "XRAY",
        s3Url: source,
        fileName: item.fileName,
        notes: item.notes,
        uploadedByDoctorId: item.uploadedByDoctorId,
        uploadedAt: item.uploadedAt,
        createdAt: item.createdAt,
      };
    })
    .filter((item: VisitImage | null): item is VisitImage => Boolean(item));

  if (normalizedNewImages.length > 0) return normalizedNewImages;

  const oldImages =
    visit?.xrayUrls ?? visit?.radiographUrls ?? visit?.xrays ?? [];

  if (!Array.isArray(oldImages)) return [];

  return oldImages
    .map((item: any, index: number): VisitImage | null => {
      if (typeof item === "string") {
        const source = item.trim();

        return source
          ? {
              id: `${source}-${index}`,
              s3Url: source,
              imageType: "XRAY",
            }
          : null;
      }

      if (!item || typeof item !== "object") return null;

      const source = String(
        item.s3Url ??
          item.url ??
          item.fileUrl ??
          item.storagePath ??
          item.path ??
          ""
      ).trim();

      if (!source) return null;

      return {
        id: String(item.id ?? item._id ?? `${source}-${index}`),
        toothNumber: item.toothNumber,
        imageType: item.imageType || "XRAY",
        s3Url: source,
        fileName: item.fileName,
        notes: item.notes,
        uploadedAt: item.uploadedAt,
      };
    })
    .filter((item: VisitImage | null): item is VisitImage => Boolean(item));
}

function readStringField(
  value: unknown,
  fieldNames: readonly string[]
): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

  for (const fieldName of fieldNames) {
    const fieldValue = record[fieldName];

    if (
      typeof fieldValue === "string" &&
      fieldValue.trim().length > 0
    ) {
      return fieldValue.trim();
    }
  }

  return "";
}

function getUploadedFileUrl(file: unknown): string {
  /**
   * Private bucket uchun storagePath/path/key eng ishonchli qiymat.
   * `s3Url` field nomi backend contract sabab saqlanadi, lekin uning
   * qiymati storage path bo'lishi mumkin.
   */
  const value = readStringField(file, [
    "storagePath",
    "path",
    "key",
    "s3Url",
    "publicUrl",
    "url",
    "fileUrl",
  ]);

  if (!value) {
    throw new Error(
      "Storage upload response ichidan storagePath yoki rasm URL'i topilmadi"
    );
  }

  return value;
}

function getUploadedFileName(
  uploadedFile: unknown,
  originalFile?: File
): string {
  return (
    readStringField(uploadedFile, [
      "fileName",
      "originalFileName",
      "name",
    ]) ||
    originalFile?.name ||
    "xray-image"
  );
}

function mergeVisitImages(
  first: VisitImage[],
  second: VisitImage[]
): VisitImage[] {
  const merged = new Map<string, VisitImage>();

  [...first, ...second].forEach((image, index) => {
    const key =
      image.id ||
      image._id ||
      `${image.appointmentId || "appointment"}-${image.s3Url}-${index}`;

    merged.set(key, image);
  });

  return Array.from(merged.values());
}

function getAppointmentIdFromVisitResponse(response: unknown): string {
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

  if (directValue) return directValue.trim();

  const visitArrays = [
    data?.visits,
    data?.course?.visits,
    data?.data?.visits,
    data?.data?.course?.visits,
    data?.result?.visits,
    data?.result?.course?.visits,
  ];

  for (const visits of visitArrays) {
    if (!Array.isArray(visits) || visits.length === 0) continue;

    const lastVisit = visits[visits.length - 1];
    const value = lastVisit?.appointmentId;

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function createDentalImage(
  payload: CreateDentalImagePayload
): Promise<VisitImage> {
  const http = tenantHttp();

  const response = await http.post(
    DENTAL_IMAGES_ENDPOINT,
    payload
  );

  const raw = response.data as any;
  const image = raw?.data ?? raw?.item ?? raw;

  return {
    ...payload,
    ...(image && typeof image === "object" ? image : {}),
    patientId: image?.patientId || payload.patientId,
    appointmentId: image?.appointmentId || payload.appointmentId,
    toothNumber: image?.toothNumber || payload.toothNumber,
    imageType: image?.imageType || payload.imageType,
    s3Url: image?.s3Url || payload.s3Url,
    fileName: image?.fileName || payload.fileName,
    notes: image?.notes ?? payload.notes,
  };
}

function getApiErrorMessage(error: any, fallback: string): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

// -----------------------------------------------------------------------------
// UI helpers
// -----------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400">
      {children}
    </label>
  );
}

function TabButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-[#35a8f5] text-white shadow-md shadow-blue-200"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}

      {badge !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs font-extrabold ${
            active
              ? "bg-white/25 text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function PatientInfoCard({
  patient,
  isLoading,
}: {
  patient?: PatientInfo;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2.5">
            <div className="h-6 w-52 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-4 w-36 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  const name =
    patient?.fullName ||
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim();
  const phone = patient?.phoneNumber || patient?.phone || "—";
  const birthDate = patient?.birthDate || patient?.dateOfBirth;
  const isActive = patient?.active !== false && patient?.status !== "INACTIVE";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#35a8f5]/[0.06]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#35a8f5] to-[#1d8ee8] text-lg font-black text-white shadow-md shadow-blue-200">
            {name ? getInitials(name) : <UserRound size={26} />}
          </div>

          <div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-950">
              {name || "Noma'lum bemor"}
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Tug'ilgan sana
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-950">
              {formatBirthDate(birthDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Yoshi
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-950">
              {formatPatientAge(birthDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Holat
            </p>
            <p
              className={`mt-0.5 inline-flex items-center gap-1 text-sm font-extrabold ${
                isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitXrayImage({
  image,
  index,
}: {
  image: VisitImage;
  index: number;
}) {
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

  useEffect(() => {
    setDirectImageFailed(false);
  }, [source]);

  /**
   * Backblaze bucket private bo‘lishi mumkin. Shuning uchun Backblaze URL
   * bo‘lsa public URL'ni sinamasdan storage endpoint orqali ochamiz.
   */
  const shouldUseStorageFirst =
    !direct || isBackblazeImageUrl(source);

  const useStorageFallback =
    shouldUseStorageFirst || directImageFailed;

  const imageUrl = useStorageFallback
    ? storageImage.url
    : source;

  const isLoading =
    useStorageFallback &&
    Boolean(storagePath) &&
    storageImage.isFetching &&
    !imageUrl;

  const hasError =
    useStorageFallback &&
    (!storagePath || storageImage.isError) &&
    !imageUrl;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex aspect-video items-center justify-center bg-slate-100">
          <DentalLoaderIcon size={24} className="text-[#35a8f5]" />
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
            Rentgen rasmini ochib bo'lmadi
          </p>

          {source ? (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 underline"
            >
              Original URL'ni tekshirish
            </a>
          ) : null}
        </div>

        <div className="space-y-1 p-3">
          <p className="truncate text-xs font-bold text-slate-700">
            {image.fileName || `Rentgen ${index + 1}`}
          </p>

          {storagePath ? (
            <p
              title={storagePath}
              className="truncate text-[10px] text-slate-400"
            >
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
          alt={image.fileName || `Rentgen ${index + 1}`}
          loading="lazy"
          onError={() => {
            /**
             * Faqat oddiy direct URL ishlamasa storage fallback'ga o‘tamiz.
             * Backblaze URL allaqachon storage orqali ochiladi.
             */
            if (
              direct &&
              !shouldUseStorageFirst &&
              !directImageFailed
            ) {
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
            {image.fileName || `Rentgen ${index + 1}`}
          </p>

          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
            {image.imageType || "XRAY"}
          </span>
        </div>

        {image.toothNumber ? (
          <p className="text-xs font-semibold text-[#35a8f5]">
            {image.toothNumber}-tish
          </p>
        ) : null}

        {image.notes ? (
          <p className="text-xs leading-relaxed text-slate-500">
            {image.notes}
          </p>
        ) : null}

        {image.uploadedAt || image.createdAt ? (
          <p className="text-[11px] text-slate-400">
            {formatVisitDateTime(
              image.uploadedAt || image.createdAt
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function VisitXrayGallery({ images }: { images: VisitImage[] }) {
  if (!images.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon size={15} className="text-[#35a8f5]" />
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">
          Rentgenlar
        </p>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
          {images.length} ta
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

// -----------------------------------------------------------------------------
// Visit modal content
// -----------------------------------------------------------------------------

type VisitFormProps = {
  activeCourses: any[];
  selectedCourseId: string;
  onCourseChange: (value: string) => void;
  doctors: any[];
  doctorId: string;
  onDoctorChange: (value: string) => void;
  doctorLocked: boolean;
  lockedDoctorName: string;
  visitDate: string;
  onVisitDateChange: (value: string) => void;
  doctorNotes: string;
  onDoctorNotesChange: (value: string) => void;
  selectedXrays: SelectedXray[];
  onSelectXrays: (files: File[]) => void;
  onRemoveXray: (id: string) => void;
  selectedTooth: string;
  onToothChange: (value: string) => void;
  treatmentTeeth: string[];
  visitItems: TreatmentVisitItem[];
  onRemoveVisitItem: (index: number) => void;
  procedures: DentalProcedure[];
  proceduresLoading: boolean;
  procedureSearch: string;
  onProcedureSearchChange: (value: string) => void;
  onAddProcedure: (procedure: DentalProcedure) => void;
  onGoToChart: () => void;
  onSave: () => void;
  isSaving: boolean;
  isCompleted: boolean;
  isNewAppointment: boolean;
};

function VisitForm({
  activeCourses,
  selectedCourseId,
  onCourseChange,
  doctors,
  doctorId,
  onDoctorChange,
  doctorLocked,
  lockedDoctorName,
  visitDate,
  onVisitDateChange,
  doctorNotes,
  onDoctorNotesChange,
  selectedXrays,
  onSelectXrays,
  onRemoveXray,
  selectedTooth,
  onToothChange,
  treatmentTeeth,
  visitItems,
  onRemoveVisitItem,
  procedures,
  proceduresLoading,
  procedureSearch,
  onProcedureSearchChange,
  onAddProcedure,
  onGoToChart,
  onSave,
  isSaving,
  isCompleted,
  isNewAppointment,
}: VisitFormProps) {
  const totalPrice = visitItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>Davolash kursi</SectionLabel>
            <select
              value={selectedCourseId}
              onChange={(event) => onCourseChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
            >
              <option value="">Kurs tanlang</option>
              {activeCourses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {course.mainDiagnosis}
                </option>
              ))}
            </select>
          </div>

          <div>
            <SectionLabel>Shifokor</SectionLabel>

            {doctorLocked ? (
              <div className="flex h-[46px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#35a8f5]/10 text-[#35a8f5]">
                  <Stethoscope size={14} />
                </div>
                <span className="truncate text-sm font-bold text-slate-950">
                  {lockedDoctorName || "Siz"}
                </span>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  SIZ
                </span>
              </div>
            ) : (
              <select
                value={doctorId}
                onChange={(event) => onDoctorChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
              >
                <option value="">Shifokor tanlang</option>
                {doctors.map((doctor) => {
                  const id = getId(doctor);
                  return (
                    <option key={id} value={id}>
                      {getFullName(doctor) || "Doctor"}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        <div>
          <SectionLabel>Tashrif sanasi</SectionLabel>
          <input
            type="datetime-local"
            value={visitDate}
            onChange={(event) => onVisitDateChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
          />
        </div>

        <div>
          <SectionLabel>Shifokor izohi</SectionLabel>
          <textarea
            value={doctorNotes}
            onChange={(event) => onDoctorNotesChange(event.target.value)}
            placeholder="Kanal doimiy material bilan to'ldirildi..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
          />
        </div>

        <div>
          <SectionLabel>Rentgen rasmlari</SectionLabel>

          <label
            htmlFor="visit-xray-input"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
              isSaving
                ? "cursor-not-allowed border-slate-200 bg-slate-50"
                : "cursor-pointer border-blue-200 bg-blue-50/50 hover:border-[#35a8f5] hover:bg-blue-50"
            }`}
          >
            {isSaving ? (
              <DentalLoaderIcon size={24} className="text-[#35a8f5]" />
            ) : (
              <Upload size={24} className="text-[#35a8f5]" />
            )}

            <p className="mt-2 text-sm font-black text-slate-950">
              Rentgen yuklash
            </p>
            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG yoki WEBP · maksimal 10 MB · 10 tagacha
            </p>

            <input
              id="visit-xray-input"
              hidden
              multiple
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isSaving}
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                onSelectXrays(files);
                event.target.value = "";
              }}
            />
          </label>

          {selectedXrays.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {selectedXrays.map((xray, index) => (
                <div
                  key={xray.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"
                >
                  <img
                    src={xray.previewUrl}
                    alt={`Tanlangan rentgen ${index + 1}`}
                    className="aspect-video h-full w-full object-contain"
                  />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/70 px-3 py-2">
                    <p className="min-w-0 truncate text-xs font-semibold text-white">
                      {xray.file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveXray(xray.id)}
                      disabled={isSaving}
                      className="shrink-0 rounded-lg bg-red-500/90 p-1.5 text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Rentgen ixtiyoriy. Yuklangan rasm visit yaratilgandan keyin
              alohida image record sifatida saqlanadi.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Davolanadigan tish
            </p>
            <span className="rounded-full bg-[#35a8f5] px-2.5 py-1 text-xs font-black text-white">
              #{selectedTooth}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {treatmentTeeth.length === 0 ? (
              <button
                type="button"
                onClick={onGoToChart}
                className="rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[#35a8f5] ring-1 ring-inset ring-slate-200 transition hover:bg-blue-50"
              >
                Chartdan tish tanlash →
              </button>
            ) : (
              treatmentTeeth.map((toothNumber) => (
                <button
                  key={toothNumber}
                  type="button"
                  onClick={() => onToothChange(toothNumber)}
                  className={`h-9 min-w-[38px] rounded-xl px-2.5 text-sm font-black transition ${
                    selectedTooth === toothNumber
                      ? "bg-[#35a8f5] text-white shadow-sm shadow-blue-200"
                      : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-blue-50"
                  }`}
                >
                  {toothNumber}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Tanlangan muolajalar
            </p>
            <p className="text-sm font-black text-[#35a8f5]">
              {formatMoney(totalPrice)}
            </p>
          </div>

          {visitItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-400">
              Hali muolaja tanlanmadi
            </p>
          ) : (
            <div className="space-y-2">
              {visitItems.map((item, index) => (
                <div
                  key={`${item.toothNumber}-${item.procedureId}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {item.toothNumber}-tish · {item.note || "Muolaja"}
                    </p>
                    <p className="text-xs font-bold text-[#35a8f5]">
                      {formatMoney(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveVisitItem(index)}
                    className="shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCompleted && isNewAppointment && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Sparkles
              size={16}
              className="mt-0.5 shrink-0 text-blue-500"
            />
            <p className="text-sm font-semibold text-blue-700">
              Appointment URL'da yo'q. Visit saqlanganda backend yangi
              appointment yaratishi va response ichida appointmentId qaytarishi
              kerak.
            </p>
          </div>
        )}

        {isCompleted ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Lock size={18} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              Yakunlangan kursga visit qo'shib bo'lmaydi.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <DentalLoaderIcon size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saqlanmoqda..." : "Visitni saqlash"}
          </button>
        )}
      </div>

      <div className="flex flex-col">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Muolajalar · <span className="text-[#35a8f5]">{selectedTooth}-tish</span>
          </p>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={procedureSearch}
              onChange={(event) =>
                onProcedureSearchChange(event.target.value)
              }
              placeholder="Qidirish..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10 sm:w-56"
            />
          </div>
        </div>

        {proceduresLoading ? (
          <DentalLoader fullScreen={false} text="Muolajalar yuklanmoqda..." />
        ) : procedures.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-800">Muolaja topilmadi</p>
            <p className="mt-1 text-sm text-amber-700">
              Avval muolaja qo'shing.
            </p>
            <Link
              href="/procedures"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              <Plus size={14} />
              Muolajalar sahifasi
            </Link>
          </div>
        ) : (
          <div className="grid max-h-[50vh] auto-rows-min gap-2 overflow-y-auto pr-1 sm:max-h-[680px] sm:grid-cols-2">
            {procedures.map((procedure) => (
              <button
                key={getId(procedure)}
                type="button"
                onClick={() => onAddProcedure(procedure)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#35a8f5]/40 hover:shadow-md hover:shadow-blue-100"
              >
                <p className="font-bold leading-snug text-slate-950">
                  {procedure.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {procedure.code}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-black text-[#35a8f5]">
                    {formatMoney(procedure.defaultPrice)}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    + Qo'shish
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function TreatmentPatientPage() {
  const params = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const patientId = params.patientId;
  const appointmentId = searchParams.get("appointmentId") || "";

  const currentUser = useAuthStore((state) => state.user);
  const isDoctorUser = useAuthStore((state) => state.isDoctor());
  const currentUserId =
    (currentUser as any)?.id || (currentUser as any)?._id || "";
  const currentUserName = getFullName(currentUser as any);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientById(patientId),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  });

  const { data: allStaff = [] } = useGetDoctors();
  const doctors = allStaff.filter((staff: any) =>
    staff.roles?.includes(Role.DOCTOR)
  );

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();

    allStaff.forEach((staff: any) => {
      const id = getId(staff);
      if (id) map.set(id, staff);
    });

    return map;
  }, [allStaff]);

  const [activeTab, setActiveTab] = useState<TreatmentTab>("CHART");
  const [courseStatusFilter, setCourseStatusFilter] =
    useState<CourseStatusFilter>("ACTIVE");
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] =
    useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);

  const {
    chart,
    isLoading: chartLoading,
    createChart,
    updateChart,
    isCreating,
    isUpdating,
  } = useDentalChart(patientId);

  const {
    courses,
    isLoading: coursesLoading,
    createCourse,
    addVisit,
    completeCourse,
    isCreating: isCreatingCourse,
    isAddingVisit,
    isCompleting,
  } = useTreatmentCourses(patientId);

  const [procedureSearch, setProcedureSearch] = useState("");
  const { procedures, isLoading: proceduresLoading } =
    useDentalProcedures(procedureSearch);

  const [selectedTooth, setSelectedTooth] = useState("16");
  const [localToothMap, setLocalToothMap] = useState<ToothMap>({});

  const [mainDiagnosis, setMainDiagnosis] = useState("");
  const [selectedCourseTeeth, setSelectedCourseTeeth] = useState<string[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [visitDate, setVisitDate] = useState(nowLocalIso);
  const [visitItems, setVisitItems] = useState<TreatmentVisitItem[]>([]);

  const uploadXraysMutation = useUploadFiles();
  const [selectedXrays, setSelectedXrays] = useState<SelectedXray[]>([]);

  /**
   * POST /api/dental/images natijalarini appointmentId bo'yicha saqlaydi.
   *
   * Treatment course endpoint yangi image record'ni visit.images ichida
   * darhol qaytarmasa ham rasm shu sahifada darhol ko'rinadi.
   */
  const [createdImagesByAppointmentId, setCreatedImagesByAppointmentId] =
    useState<Record<string, VisitImage[]>>({});

  const selectedXraysRef = useRef<SelectedXray[]>([]);

  useEffect(() => {
    selectedXraysRef.current = selectedXrays;
  }, [selectedXrays]);

  useEffect(() => {
    return () => {
      selectedXraysRef.current.forEach((xray) => {
        URL.revokeObjectURL(xray.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (isDoctorUser && currentUserId) {
      setDoctorId(currentUserId);
    }
  }, [isDoctorUser, currentUserId]);

  const toothMap: ToothMap = useMemo(
    () =>
      Object.keys(localToothMap).length > 0
        ? localToothMap
        : chart?.toothMap || {},
    [localToothMap, chart]
  );

  const selectedToothData = toothMap[selectedTooth] || emptyTooth();
  const activeCourses = courses.filter(
    (course) => course.status !== "COMPLETED"
  );
  const completedCourses = courses.filter(
    (course) => course.status === "COMPLETED"
  );
  const visibleCourses =
    courseStatusFilter === "ACTIVE" ? activeCourses : completedCourses;
  const selectedCourse = courses.find(
    (course) => getId(course) === selectedCourseId
  );
  const isSelectedCourseCompleted =
    selectedCourse?.status === "COMPLETED";

  const selectedHistoryCourse =
    visibleCourses.find(
      (course) => getId(course) === selectedCourseId
    ) ||
    visibleCourses[0] ||
    null;
  const selectedHistoryVisits = selectedHistoryCourse?.visits || [];

  const chartProblemTeeth = useMemo(
    () =>
      Object.entries(toothMap)
        .filter(
          ([, item]) =>
            item.diagnoses?.length ||
            item.states?.length ||
            item.note?.trim()
        )
        .map(([toothNumber, item]) => ({
          toothNumber,
          diagnosis: item.diagnoses?.[0] || "",
          state: item.states?.[0] || "",
          note: item.note || "",
        }))
        .sort(
          (first, second) =>
            Number(first.toothNumber) - Number(second.toothNumber)
        ),
    [toothMap]
  );

  const treatmentTeeth = useMemo(
    () =>
      selectedCourseTeeth.length > 0
        ? selectedCourseTeeth
        : chartProblemTeeth.map((item) => item.toothNumber),
    [selectedCourseTeeth, chartProblemTeeth]
  );

  function buildDiagnosis(teeth: string[]): string {
    if (!teeth.length) return "";

    const teethText = teeth
      .map((toothNumber) => `${toothNumber}-tish`)
      .join(", ");
    const diagnoses = [
      ...new Set(
        teeth
          .map((toothNumber) => toothMap[toothNumber]?.diagnoses?.[0])
          .filter(Boolean)
      ),
    ];
    const diagnosisText = diagnoses
      .map(
        (diagnosis) =>
          CONDITION_LABELS[diagnosis as ToothCondition] || diagnosis
      )
      .join(", ");

    return `${teethText} ${diagnosisText || "davolanishi"}`;
  }

  function handleToggleCourseTooth(toothNumber: string) {
    setSelectedCourseTeeth((previous) => {
      const next = previous.includes(toothNumber)
        ? previous.filter((item) => item !== toothNumber)
        : [...previous, toothNumber].sort(
            (first, second) => Number(first) - Number(second)
          );

      setMainDiagnosis((current) =>
        current.trim() ? current : buildDiagnosis(next)
      );

      if (next.length > 0) setSelectedTooth(next[0]);

      return next;
    });
  }

  function updateSelectedTooth(next: Partial<ToothItem>) {
    setLocalToothMap((previous) => {
      const base =
        Object.keys(previous).length > 0
          ? previous
          : chart?.toothMap || {};

      return {
        ...base,
        [selectedTooth]: {
          ...(base[selectedTooth] || emptyTooth()),
          ...next,
        },
      };
    });
  }

  function handleClearTooth() {
    setLocalToothMap((previous) => {
      const base =
        Object.keys(previous).length > 0
          ? previous
          : chart?.toothMap || {};
      const next = { ...base };

      delete next[selectedTooth];

      return next;
    });
  }

  async function handleSaveChart() {
    if (!Object.keys(toothMap).length) {
      toast.warning("Kamida bitta tish tanlang");
      return;
    }

    try {
      const payload = { patientId, toothMap };

      if (chart && getId(chart)) {
        await updateChart({
          chartId: getId(chart),
          payload,
        });
      } else {
        await createChart(payload);
      }

      setLocalToothMap({});
      toast.success("Dental chart saqlandi");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Chartni saqlab bo'lmadi"));
    }
  }

  async function handleCreateCourse() {
    if (!selectedCourseTeeth.length) {
      toast.warning("Davolanadigan tishlarni tanlang");
      return;
    }

    const diagnosis =
      mainDiagnosis.trim() || buildDiagnosis(selectedCourseTeeth);

    if (!diagnosis) {
      toast.warning("Diagnosis kiriting");
      return;
    }

    try {
      const created = await createCourse({
        patientId,
        mainDiagnosis: diagnosis,
      });

      setMainDiagnosis("");
      setSelectedCourseId(getId(created));
      setIsCreateCourseModalOpen(false);
      setActiveTab("COURSE");
      toast.success("Davolash kursi yaratildi");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Davolash kursini yaratib bo'lmadi")
      );
    }
  }

  function handleAddProcedure(procedure: DentalProcedure) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      toast.error("Procedure ID topilmadi");
      return;
    }

    const alreadyAdded = visitItems.some(
      (item) =>
        item.procedureId === procedureId &&
        item.toothNumber === selectedTooth
    );

    if (alreadyAdded) {
      toast.warning("Bu muolaja allaqachon qo'shilgan");
      return;
    }

    setVisitItems((previous) => [
      ...previous,
      {
        toothNumber: selectedTooth,
        procedureId,
        price: Number(procedure.defaultPrice || 0),
        completed: true,
        note: procedure.name,
      },
    ]);

    if (procedure.resultingCondition) {
      setLocalToothMap((previous) => {
        const base =
          Object.keys(previous).length > 0
            ? previous
            : chart?.toothMap || {};
        const current = base[selectedTooth] || emptyTooth();

        return {
          ...base,
          [selectedTooth]: {
            ...current,
            states: [procedure.resultingCondition as ToothCondition],
            note: current.note || procedure.name,
          },
        };
      });
    }
  }

  function handleSelectXrays(files: File[]) {
    if (!files.length) return;

    const validFiles: File[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.warning(`${file.name} rasm fayli emas`);
        return;
      }

      if (file.size > MAX_XRAY_FILE_SIZE) {
        toast.warning(`${file.name} hajmi 10 MB dan katta`);
        return;
      }

      validFiles.push(file);
    });

    setSelectedXrays((previous) => {
      const availableCount = MAX_XRAY_FILES - previous.length;

      if (availableCount <= 0) {
        toast.warning(
          `Maksimal ${MAX_XRAY_FILES} ta rentgen yuklash mumkin`
        );
        return previous;
      }

      const acceptedFiles = validFiles.slice(0, availableCount);

      if (acceptedFiles.length < validFiles.length) {
        toast.warning(
          `Faqat ${MAX_XRAY_FILES} ta rentgen yuklash mumkin`
        );
      }

      return [
        ...previous,
        ...acceptedFiles.map((file) => ({
          id: createClientId(file),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });
  }

  function handleRemoveXray(xrayId: string) {
    setSelectedXrays((previous) => {
      const removed = previous.find((xray) => xray.id === xrayId);

      if (removed) URL.revokeObjectURL(removed.previewUrl);

      return previous.filter((xray) => xray.id !== xrayId);
    });
  }

  function clearSelectedXrays() {
    setSelectedXrays((previous) => {
      previous.forEach((xray) => {
        URL.revokeObjectURL(xray.previewUrl);
      });

      return [];
    });
  }

  function closeAddVisitModal() {
    if (uploadXraysMutation.isPending || isAddingVisit) return;

    clearSelectedXrays();
    setIsAddVisitModalOpen(false);
  }

  async function refreshTreatmentQueries() {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        const hasPatientId = key.some(
          (part) => String(part) === patientId
        );
        const hasTreatmentKey = key.some((part) => {
          const value = String(part).toLowerCase();

          return (
            value.includes("treatment") ||
            value.includes("course") ||
            value.includes("visit") ||
            value.includes("image")
          );
        });

        return hasPatientId && hasTreatmentKey;
      },
    });

    await queryClient.refetchQueries({
      predicate: (query) => {
        const key = query.queryKey;
        const hasPatientId = key.some(
          (part) => String(part) === patientId
        );
        const hasTreatmentKey = key.some((part) => {
          const value = String(part).toLowerCase();

          return (
            value.includes("treatment") ||
            value.includes("course") ||
            value.includes("visit") ||
            value.includes("image")
          );
        });

        return hasPatientId && hasTreatmentKey;
      },
      type: "active",
    });
  }

  async function handleAddVisit() {
    if (!selectedCourseId) {
      toast.warning("Treatment course tanlang");
      return;
    }

    if (isSelectedCourseCompleted) {
      toast.warning("Bu kurs yakunlangan — visit qo'sha olmaysiz");
      return;
    }

    if (!doctorId) {
      toast.warning("Doctor tanlang");
      return;
    }

    if (!doctorNotes.trim()) {
      toast.warning("Shifokor izohi kiriting");
      return;
    }

    if (!visitItems.length) {
      toast.warning("Kamida bitta muolaja tanlang");
      return;
    }

    let visitCreated = false;

    try {
      let uploadedXrays: unknown[] = [];

      // 1. Rentgenlarni storage'ga yuklash.
      if (selectedXrays.length > 0) {
        const uploadResult = await uploadXraysMutation.mutateAsync({
          files: selectedXrays.map((xray) => xray.file),
          target: StorageTarget.DOCUMENTS,
          bucket: STORAGE_BUCKET,
        });

        uploadedXrays = Array.isArray(uploadResult)
          ? uploadResult
          : [];
      }

      // 2. Visit yaratish. Endi xrayUrls visit payload'iga yuborilmaydi.
      const visitResponse = await addVisit({
        courseId: selectedCourseId,
        payload: {
          ...(appointmentId ? { appointmentId } : {}),
          visitDate,
          doctorId,
          doctorNotes: doctorNotes.trim(),
          items: visitItems,
        },
      });

      visitCreated = true;

      // 3. URL'dagi yoki yangi visit response'idagi appointmentId.
      const resolvedAppointmentId =
        appointmentId || getAppointmentIdFromVisitResponse(visitResponse);

      // 4. Har bir rasm uchun POST /api/dental/images.
      if (uploadedXrays.length > 0) {
        if (!resolvedAppointmentId) {
          throw new Error(
            "Visit yaratildi, lekin appointmentId topilmadi. Backend addVisit response ichida appointmentId qaytarishi kerak."
          );
        }

        const createdImages = await Promise.all(
          uploadedXrays.map(async (uploadedFile, index) => {
            const s3Url = getUploadedFileUrl(uploadedFile);
            const fileName = getUploadedFileName(
              uploadedFile,
              selectedXrays[index]?.file
            );

            return createDentalImage({
              patientId,
              appointmentId: resolvedAppointmentId,
              toothNumber: selectedTooth || undefined,
              imageType: "XRAY",
              s3Url,
              fileName,
              notes: doctorNotes.trim() || undefined,
            });
          })
        );

        /**
         * Course response ichida visit.images hozircha kelmasa ham,
         * POST response'dagi rasmlar visit galereyasida darhol chiqadi.
         */
        setCreatedImagesByAppointmentId((previous) => ({
          ...previous,
          [resolvedAppointmentId]: mergeVisitImages(
            previous[resolvedAppointmentId] || [],
            createdImages
          ),
        }));
      }

      // 5. Dental chartdagi o'zgarishlarni saqlash.
      if (Object.keys(toothMap).length > 0) {
        const payload = { patientId, toothMap };

        if (chart && getId(chart)) {
          await updateChart({
            chartId: getId(chart),
            payload,
          });
        } else {
          await createChart(payload);
        }

        setLocalToothMap({});
      }

      // 6. visit.images yangilanishi uchun query'larni refetch qilish.
      await refreshTreatmentQueries();

      setDoctorNotes("");
      setVisitItems([]);
      clearSelectedXrays();
      setIsAddVisitModalOpen(false);
      setActiveTab("COURSE");

      toast.success(
        uploadedXrays.length > 0
          ? "Visit va rentgen rasmlari saqlandi"
          : appointmentId
            ? "Visit saqlandi"
            : "Muolaja boshlandi, appointment avtomatik yaratildi"
      );
    } catch (error) {
      console.error("Visit/Image save failed:", error);

      const message = getApiErrorMessage(
        error,
        "Visit yoki rentgenni saqlashda xatolik yuz berdi"
      );

      if (visitCreated) {
        toast.error(
          `Visit yaratildi, lekin keyingi bosqich bajarilmadi: ${message}`
        );
      } else {
        toast.error(message);
      }
    }
  }

  async function handleCompleteCourse(courseId: string) {
    if (!window.confirm("Davolanish kursini yakunlaysizmi?")) return;

    try {
      await completeCourse(courseId);

      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
        setVisitItems([]);
      }

      setCourseStatusFilter("COMPLETED");
      toast.success("Kurs yakunlandi");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kursni yakunlab bo'lmadi"));
    }
  }

  function openAddVisitModal(courseId: string) {
    const course = courses.find((item) => getId(item) === courseId);

    if (course?.status === "COMPLETED") {
      toast.warning("Bu kurs yakunlangan — visit qo'sha olmaysiz");
      return;
    }

    clearSelectedXrays();
    setSelectedCourseId(courseId);
    setVisitItems([]);
    setDoctorNotes("");
    setVisitDate(nowLocalIso());
    setDoctorId(
      isDoctorUser && currentUserId ? currentUserId : ""
    );
    setIsAddVisitModalOpen(true);
  }

  const isVisitSaving =
    isAddingVisit ||
    isCreating ||
    isUpdating ||
    uploadXraysMutation.isPending;

  return (
    <div className="space-y-5 bg-[#F7FAFC] pb-6 sm:space-y-6">
      <PatientInfoCard
        patient={patient as PatientInfo | undefined}
        isLoading={patientLoading}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <TabButton
          active={activeTab === "CHART"}
          icon={<Activity size={16} />}
          label="Dental Chart"
          badge={chartProblemTeeth.length || undefined}
          onClick={() => setActiveTab("CHART")}
        />
        <TabButton
          active={activeTab === "COURSE"}
          icon={<ClipboardList size={16} />}
          label="Davolash kursi"
          badge={activeCourses.length || undefined}
          onClick={() => setActiveTab("COURSE")}
        />

        {activeTab === "CHART" && chartProblemTeeth.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const teeth = chartProblemTeeth.map(
                (item) => item.toothNumber
              );

              if (!selectedCourseTeeth.length) {
                setSelectedCourseTeeth(teeth);
                if (teeth.length) setSelectedTooth(teeth[0]);
              }

              if (!mainDiagnosis.trim()) {
                setMainDiagnosis(
                  buildDiagnosis(
                    selectedCourseTeeth.length
                      ? selectedCourseTeeth
                      : teeth
                  )
                );
              }

              setIsCreateCourseModalOpen(true);
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Kurs ochish
          </button>
        )}
      </div>

      {activeTab === "CHART" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {chartLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white">
                <DentalLoader
                  fullScreen={false}
                  text="Chart yuklanmoqda..."
                />
              </div>
            ) : (
              <>
                {chart?.toothMap && (
                  <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <Sparkles size={15} className="text-blue-500" />
                      Avvalgi chart topildi
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalToothMap(chart.toothMap || {})
                      }
                      className="rounded-xl bg-[#35a8f5] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1d8ee8]"
                    >
                      Yuklash
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Chart holati",
                      value: chart ? "Mavjud" : "Yangi",
                      className: chart
                        ? "text-emerald-600"
                        : "text-[#35a8f5]",
                    },
                    {
                      label: "Belgilangan tishlar",
                      value: chartProblemTeeth.length,
                      className: "text-slate-950",
                    },
                    {
                      label: "Tanlangan",
                      value: `#${selectedTooth}`,
                      className: "text-[#35a8f5]",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>
                      <p
                        className={`mt-1.5 text-xl font-black ${item.className}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <Dental3DChart
                    selectedTooth={selectedTooth}
                    toothMap={toothMap}
                    onSelectTooth={(toothNumber) => {
                      setSelectedTooth(toothNumber);
                      setLocalToothMap((previous) => {
                        const base =
                          Object.keys(previous).length > 0
                            ? previous
                            : chart?.toothMap || {};

                        return {
                          ...base,
                          [toothNumber]:
                            base[toothNumber] || emptyTooth(),
                        };
                      });
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Tanlangan tish
                </p>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Tish #{selectedTooth}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#35a8f5]/10 text-[#35a8f5]">
                <Edit3 size={18} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <SectionLabel>Diagnoz</SectionLabel>
                <select
                  value={selectedToothData.diagnoses?.[0] || ""}
                  onChange={(event) =>
                    updateSelectedTooth({
                      diagnoses: event.target.value
                        ? [event.target.value as ToothCondition]
                        : [],
                    })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
                >
                  <option value="">Diagnoz tanlang</option>
                  {DIAGNOSIS_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {CONDITION_LABELS[condition]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <SectionLabel>Holat</SectionLabel>
                <select
                  value={selectedToothData.states?.[0] || ""}
                  onChange={(event) =>
                    updateSelectedTooth({
                      states: event.target.value
                        ? [event.target.value as ToothCondition]
                        : [],
                    })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
                >
                  <option value="">Holat tanlang</option>
                  {STATE_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {CONDITION_LABELS[condition]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <SectionLabel>Izoh</SectionLabel>
                <textarea
                  value={selectedToothData.note || ""}
                  onChange={(event) =>
                    updateSelectedTooth({ note: event.target.value })
                  }
                  rows={4}
                  placeholder="Tish bo'yicha izoh..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#35a8f5] focus:ring-4 focus:ring-[#35a8f5]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClearTooth}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Tozalash
                </button>

                <button
                  type="button"
                  onClick={handleSaveChart}
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#35a8f5] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d8ee8] disabled:opacity-60"
                >
                  {isCreating || isUpdating ? (
                    <DentalLoaderIcon size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "COURSE" && (
        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Davolash kurslari
                </p>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Kurslar ro'yxati
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  const teeth = chartProblemTeeth.map(
                    (item) => item.toothNumber
                  );
                  setSelectedCourseTeeth(teeth);
                  if (teeth.length) setSelectedTooth(teeth[0]);
                  setMainDiagnosis(buildDiagnosis(teeth));
                  setIsCreateCourseModalOpen(true);
                }}
                disabled={chartProblemTeeth.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} />
                Yangi kurs
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setCourseStatusFilter("ACTIVE")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  courseStatusFilter === "ACTIVE"
                    ? "bg-white text-[#35a8f5] shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Aktiv ({activeCourses.length})
              </button>
              <button
                type="button"
                onClick={() => setCourseStatusFilter("COMPLETED")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  courseStatusFilter === "COMPLETED"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Yakunlangan ({completedCourses.length})
              </button>
            </div>

            {coursesLoading ? (
              <DentalLoader fullScreen={false} text="Kurslar yuklanmoqda..." />
            ) : visibleCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <ClipboardList
                  size={26}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Kurs yo'q
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleCourses.map((course) => {
                  const courseId = getId(course);
                  const selected =
                    selectedHistoryCourse &&
                    getId(selectedHistoryCourse) === courseId;
                  const completed = course.status === "COMPLETED";

                  return (
                    <div
                      key={courseId}
                      className={`overflow-hidden rounded-2xl border transition ${
                        selected
                          ? "border-[#35a8f5] bg-blue-50/60 ring-1 ring-[#35a8f5]/20"
                          : "border-slate-200 bg-white hover:border-[#35a8f5]/30"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCourseId(courseId)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold leading-snug text-slate-950">
                            {course.mainDiagnosis}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                              completed
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {completed ? "Yakunlangan" : "Aktiv"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <ClipboardList size={13} />
                            {course.visits?.length || 0} visit
                          </span>
                          <span className="flex items-center gap-1 text-[#35a8f5]">
                            <Wallet size={13} />
                            {formatMoney(course.totalCoursePrice)}
                          </span>
                        </div>
                      </button>

                      {!completed && (
                        <div className="flex gap-2 border-t border-slate-200 bg-slate-50/60 p-3">
                          <button
                            type="button"
                            onClick={() => openAddVisitModal(courseId)}
                            className="flex-1 rounded-xl bg-[#35a8f5] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1d8ee8]"
                          >
                            + Visit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteCourse(courseId)}
                            disabled={isCompleting}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} />
                            Yakunlash
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {!selectedHistoryCourse ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                  <ClipboardList size={28} />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Davolash kursi tanlanmagan
                </h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Chap tomondan kurs tanlang yoki yangi kurs yarating.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Asosiy tashxis
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      {selectedHistoryCourse.mainDiagnosis}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatVisitDateTime(
                          selectedHistoryCourse.startDate
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[#35a8f5]">
                        <Wallet size={13} />
                        {formatMoney(
                          selectedHistoryCourse.totalCoursePrice
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedHistoryCourse.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() =>
                        openAddVisitModal(getId(selectedHistoryCourse))
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      <Plus size={16} />
                      Visit qo'shish
                    </button>
                  )}
                </div>

                {selectedHistoryVisits.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <Calendar size={28} className="text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      Hali visit mavjud emas
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {selectedHistoryVisits.map(
                      (visit: any, visitIndex: number) => {
                        const visitAppointmentId = String(
                          visit?.appointmentId || ""
                        );

                        const images = mergeVisitImages(
                          getVisitImages(visit),
                          visitAppointmentId
                            ? createdImagesByAppointmentId[
                                visitAppointmentId
                              ] || []
                            : []
                        );

                        return (
                          <div
                            key={`${visit.appointmentId || "visit"}-${visitIndex}`}
                            className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                                  <Calendar
                                    size={16}
                                    className="text-[#35a8f5]"
                                  />
                                  {formatVisitDateTime(visit.visitDate)}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <Stethoscope size={13} />
                                  {getVisitDoctorName(visit, doctorsMap)}
                                </p>
                              </div>

                              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#35a8f5] ring-1 ring-slate-200">
                                {formatMoney(getVisitTotal(visit))}
                              </span>
                            </div>

                            {visit.doctorNotes && (
                              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                  Shifokor izohi
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                  {visit.doctorNotes}
                                </p>
                              </div>
                            )}

                            {Array.isArray(visit.items) &&
                              visit.items.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {visit.items.map(
                                    (item: any, itemIndex: number) => (
                                      <div
                                        key={`${item.procedureId}-${item.toothNumber}-${itemIndex}`}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-bold text-slate-950">
                                            {item.toothNumber}-tish ·{" "}
                                            {item.procedureNameSnapshot ||
                                              item.note ||
                                              "Muolaja"}
                                          </p>
                                          {item.completed && (
                                            <p className="mt-0.5 text-xs font-bold text-emerald-600">
                                              Bajarildi
                                            </p>
                                          )}
                                        </div>
                                        <p className="shrink-0 text-sm font-black text-[#35a8f5]">
                                          {formatMoney(getItemPrice(item))}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                            <VisitXrayGallery images={images} />
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isCreateCourseModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div
              onClick={() => setIsCreateCourseModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-6 sm:px-6 sm:py-7">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
                    Davolash kursi yaratish
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Davolanadigan tishlarni tanlang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCourseModalOpen(false)}
                  className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-150px)] space-y-5 overflow-y-auto p-4 sm:p-6">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-blue-900">
                      Davolanadigan tishlar ({selectedCourseTeeth.length} ta)
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMainDiagnosis(
                          buildDiagnosis(selectedCourseTeeth)
                        )
                      }
                      disabled={!selectedCourseTeeth.length}
                      className="rounded-xl bg-[#35a8f5] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1d8ee8] disabled:opacity-40"
                    >
                      Auto to'ldirish
                    </button>
                  </div>

                  {chartProblemTeeth.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-500">
                      Avval Dental Chart bo'limida tish holatini belgilang.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {chartProblemTeeth.map((item) => {
                        const active = selectedCourseTeeth.includes(
                          item.toothNumber
                        );

                        return (
                          <button
                            key={item.toothNumber}
                            type="button"
                            onClick={() =>
                              handleToggleCourseTooth(item.toothNumber)
                            }
                            className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                              active
                                ? "bg-[#35a8f5] text-white shadow-sm shadow-blue-200"
                                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-blue-50"
                            }`}
                          >
                            <span className="block text-lg">
                              #{item.toothNumber}
                            </span>
                            <span className="block text-xs opacity-80">
                              {CONDITION_LABELS[
                                item.diagnosis as ToothCondition
                              ] ||
                                item.diagnosis ||
                                "—"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <SectionLabel>Asosiy tashxis</SectionLabel>
                  <textarea
                    value={mainDiagnosis}
                    onChange={(event) =>
                      setMainDiagnosis(event.target.value)
                    }
                    placeholder="Masalan: 11 va 21-tish karies davolanishi"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-[#35a8f5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseModalOpen(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:flex-1"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleCreateCourse}
                  disabled={
                    isCreatingCourse || !selectedCourseTeeth.length
                  }
                  className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto sm:flex-1"
                >
                  {isCreatingCourse
                    ? "Yaratilmoqda..."
                    : "Kurs yaratish"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isAddVisitModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div
              onClick={closeAddVisitModal}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-5xl sm:rounded-[2rem]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-6 sm:px-6 sm:py-7">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
                    Visit qo'shish
                  </h2>
                  {selectedCourse && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      Kurs:{" "}
                      <span className="font-semibold text-slate-950">
                        {selectedCourse.mainDiagnosis}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeAddVisitModal}
                  disabled={isVisitSaving}
                  className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-4 sm:p-6">
                <VisitForm
                  activeCourses={activeCourses}
                  selectedCourseId={selectedCourseId}
                  onCourseChange={setSelectedCourseId}
                  doctors={doctors}
                  doctorId={doctorId}
                  onDoctorChange={setDoctorId}
                  doctorLocked={isDoctorUser}
                  lockedDoctorName={currentUserName}
                  visitDate={visitDate}
                  onVisitDateChange={setVisitDate}
                  doctorNotes={doctorNotes}
                  onDoctorNotesChange={setDoctorNotes}
                  selectedXrays={selectedXrays}
                  onSelectXrays={handleSelectXrays}
                  onRemoveXray={handleRemoveXray}
                  selectedTooth={selectedTooth}
                  onToothChange={setSelectedTooth}
                  treatmentTeeth={treatmentTeeth}
                  visitItems={visitItems}
                  onRemoveVisitItem={(index) =>
                    setVisitItems((previous) =>
                      previous.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  procedures={procedures}
                  proceduresLoading={proceduresLoading}
                  procedureSearch={procedureSearch}
                  onProcedureSearchChange={setProcedureSearch}
                  onAddProcedure={handleAddProcedure}
                  onGoToChart={() => {
                    closeAddVisitModal();
                    setActiveTab("CHART");
                  }}
                  onSave={handleAddVisit}
                  isSaving={isVisitSaving}
                  isCompleted={Boolean(isSelectedCourseCompleted)}
                  isNewAppointment={!appointmentId}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}