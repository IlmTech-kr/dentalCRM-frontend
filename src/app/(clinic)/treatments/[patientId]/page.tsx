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
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Coins,
  Edit3,
  ExternalLink,
  ImageIcon,
  Lock,
  Plus,
  RotateCcw,
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
import { MoneyInput } from "@/src/components/ui/MoneyInput";

import DentalLoader from "@/src/components/ui/DentalLoader";
import { Dental3DChart } from "@/src/features/treatments/components/Dental3DChart";
import {
  CoursePaymentsPanel,
  AddPaymentModal,
} from "@/src/features/treatments/components/CoursePaymentsPanel";
import { CURRENCIES } from "@/src/features/treatment-payments/constants";
import type { Currency } from "@/src/features/treatment-payments/types";
import { useGetCoursePayments } from "@/src/features/treatment-payments/hooks/useTreatmentPayments";
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
type CourseDetailTab = "VISITS" | "PAYMENTS";

type SelectedXray = {
  id: string;
  file: File;
  previewUrl: string;
};

/**
 * defaultPrice — procedure qo'shilganda snapshot qilingan narx,
 * "Narxni tiklash" tugmasi shu qiymatga qaytaradi. Backend'ga yuborilmaydi.
 */
type DraftVisitItem = TreatmentVisitItem & { defaultPrice: number };

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

const CONDITION_KEYS: Record<ToothCondition, string> = {
  [ToothCondition.HEALTHY]: "healthy",
  [ToothCondition.CARIES]: "caries",
  [ToothCondition.EXTRACTED]: "extracted",
  [ToothCondition.PULPITIS]: "pulpitis",
  [ToothCondition.FILLING]: "filling",
  [ToothCondition.CROWN]: "crown",
  [ToothCondition.IMPLANT]: "implant",
  [ToothCondition.MISSING]: "missing",
  [ToothCondition.CRACK]: "crack",
  [ToothCondition.BRIDGE]: "bridge",
  [ToothCondition.ROOT_CANAL]: "rootCanal",
  [ToothCondition.GINGIVITIS]: "gingivitis",
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
          ? "bg-primary-blue text-white shadow-md shadow-blue-200"
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
  const t = useTranslations("treatments");

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
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary-blue/[0.06]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-blue to-primary-blue-dark text-lg font-black text-white shadow-md shadow-blue-200">
            {name ? getInitials(name) : <UserRound size={26} />}
          </div>

          <div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-950">
              {name || t("patientDetail.header.fallbackName")}
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {t("patientDetail.header.birthDateLabel")}
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-950">
              {formatBirthDate(birthDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {t("patientDetail.header.ageLabel")}
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-950">
              {formatPatientAge(birthDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {t("patientDetail.header.statusLabel")}
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
              {isActive
                ? t("patientDetail.header.active")
                : t("patientDetail.header.inactive")}
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
              t("patientDetail.visitHistory.xrayFallbackName", {
                number: index + 1,
              })}
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
          alt={
            image.fileName ||
            t("patientDetail.visitHistory.xrayFallbackName", {
              number: index + 1,
            })
          }
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
            {image.fileName ||
              t("patientDetail.visitHistory.xrayFallbackName", {
                number: index + 1,
              })}
          </p>

          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
            {image.imageType || "XRAY"}
          </span>
        </div>

        {image.toothNumber ? (
          <p className="text-xs font-semibold text-primary-blue">
            {t("patientDetail.visitHistory.itemTooth", {
              tooth: image.toothNumber,
            })}
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
  visitItems: DraftVisitItem[];
  onRemoveVisitItem: (index: number) => void;
  onUpdateVisitItemPrice: (index: number, price: number) => void;
  onResetVisitItemPrice: (index: number) => void;
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
  onUpdateVisitItemPrice,
  onResetVisitItemPrice,
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
  const t = useTranslations("treatments");
  const totalPrice = visitItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const selectedCourseCurrency =
    activeCourses.find((course) => getId(course) === selectedCourseId)
      ?.currency || "UZS";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>{t("patientDetail.addVisitModal.courseLabel")}</SectionLabel>
            <select
              value={selectedCourseId}
              onChange={(event) => onCourseChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
            >
              <option value="">{t("patientDetail.addVisitModal.selectCourse")}</option>
              {activeCourses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {course.mainDiagnosis}
                </option>
              ))}
            </select>
          </div>

          <div>
            <SectionLabel>{t("patientDetail.addVisitModal.doctorLabel")}</SectionLabel>

            {doctorLocked ? (
              <div className="flex h-[46px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-blue/10 text-primary-blue">
                  <Stethoscope size={14} />
                </div>
                <span className="truncate text-sm font-bold text-slate-950">
                  {lockedDoctorName || t("patientDetail.addVisitModal.you")}
                </span>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  {t("patientDetail.addVisitModal.youBadge")}
                </span>
              </div>
            ) : (
              <select
                value={doctorId}
                onChange={(event) => onDoctorChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
              >
                <option value="">{t("patientDetail.addVisitModal.selectDoctor")}</option>
                {doctors.map((doctor) => {
                  const id = getId(doctor);
                  return (
                    <option key={id} value={id}>
                      {getFullName(doctor) || t("patientDetail.addVisitModal.doctorFallback")}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        <div>
          <SectionLabel>{t("patientDetail.addVisitModal.visitDateLabel")}</SectionLabel>
          <input
            type="datetime-local"
            value={visitDate}
            onChange={(event) => onVisitDateChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
          />
        </div>

        <div>
          <SectionLabel>{t("patientDetail.addVisitModal.doctorNotesLabel")}</SectionLabel>
          <textarea
            value={doctorNotes}
            onChange={(event) => onDoctorNotesChange(event.target.value)}
            placeholder={t("patientDetail.addVisitModal.doctorNotesPlaceholder")}
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
          />
        </div>

        <div>
          <SectionLabel>{t("patientDetail.addVisitModal.xrayLabel")}</SectionLabel>

          <label
            htmlFor="visit-xray-input"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
              isSaving
                ? "cursor-not-allowed border-slate-200 bg-slate-50"
                : "cursor-pointer border-blue-200 bg-blue-50/50 hover:border-primary-blue hover:bg-blue-50"
            }`}
          >
            {isSaving ? (
              <DentalLoaderIcon size={24} className="text-primary-blue" />
            ) : (
              <Upload size={24} className="text-primary-blue" />
            )}

            <p className="mt-2 text-sm font-black text-slate-950">
              {t("patientDetail.addVisitModal.xrayUpload")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t("patientDetail.addVisitModal.xrayHint")}
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
                    alt={t("patientDetail.addVisitModal.xraySelectedAlt", {
                      number: index + 1,
                    })}
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
              {t("patientDetail.addVisitModal.xrayOptionalHint")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {t("patientDetail.addVisitModal.treatmentTooth")}
            </p>
            <span className="rounded-full bg-primary-blue px-2.5 py-1 text-xs font-black text-white">
              #{selectedTooth}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {treatmentTeeth.length === 0 ? (
              <button
                type="button"
                onClick={onGoToChart}
                className="rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-primary-blue ring-1 ring-inset ring-slate-200 transition hover:bg-blue-50"
              >
                {t("patientDetail.addVisitModal.goToChart")}
              </button>
            ) : (
              treatmentTeeth.map((toothNumber) => (
                <button
                  key={toothNumber}
                  type="button"
                  onClick={() => onToothChange(toothNumber)}
                  className={`h-9 min-w-[38px] rounded-xl px-2.5 text-sm font-black transition ${
                    selectedTooth === toothNumber
                      ? "bg-primary-blue text-white shadow-sm shadow-blue-200"
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
              {t("patientDetail.addVisitModal.selectedProcedures")}
            </p>
            <p className="text-sm font-black text-primary-blue">
              {formatMoney(totalPrice)}
            </p>
          </div>

          {visitItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-400">
              {t("patientDetail.addVisitModal.noProceduresSelected")}
            </p>
          ) : (
            <div className="space-y-2">
              {visitItems.map((item, index) => (
                <div
                  key={`${item.toothNumber}-${item.procedureId}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {t("patientDetail.addVisitModal.itemLine", {
                        tooth: item.toothNumber,
                        note:
                          item.note ||
                          t("patientDetail.addVisitModal.procedureFallback"),
                      })}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative max-w-[190px] flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-blue">
                          <Coins size={14} />
                        </span>
                        <MoneyInput
                          value={item.price}
                          onChange={(price) => onUpdateVisitItemPrice(index, price)}
                          allowDecimal
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-12 text-sm font-black text-slate-950 outline-none transition focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/10"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {selectedCourseCurrency}
                        </span>
                      </div>

                      {item.price !== item.defaultPrice && (
                        <button
                          type="button"
                          onClick={() => onResetVisitItemPrice(index)}
                          title={t("patientDetail.addVisitModal.resetPriceTitle")}
                          className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-primary-blue hover:bg-blue-50 hover:text-primary-blue"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
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
              {t("patientDetail.addVisitModal.newAppointmentInfo")}
            </p>
          </div>
        )}

        {isCompleted ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Lock size={18} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              {t("patientDetail.addVisitModal.courseCompletedLock")}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-blue px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <DentalLoaderIcon size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving
              ? t("patientDetail.addVisitModal.saving")
              : t("patientDetail.addVisitModal.saveVisit")}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:max-h-[calc(92vh-150px)] lg:overflow-y-auto lg:pr-1">
        <div className="sticky top-0 z-10 mb-3 flex flex-col gap-3 bg-white pb-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {t("patientDetail.addVisitModal.proceduresFor", {
              tooth: selectedTooth,
            })}
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
              placeholder={t("patientDetail.addVisitModal.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 sm:w-56"
            />
          </div>
        </div>

        {proceduresLoading ? (
          <DentalLoader
            fullScreen={false}
            text={t("patientDetail.addVisitModal.proceduresLoading")}
          />
        ) : procedures.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-800">
              {t("patientDetail.addVisitModal.noProceduresFound")}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {t("patientDetail.addVisitModal.addProcedureFirst")}
            </p>
            <Link
              href="/procedures"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              <Plus size={14} />
              {t("patientDetail.addVisitModal.proceduresPage")}
            </Link>
          </div>
        ) : (
          <div className="grid auto-rows-min gap-2 sm:grid-cols-2">
            {procedures.map((procedure) => (
              <button
                key={getId(procedure)}
                type="button"
                onClick={() => onAddProcedure(procedure)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-blue/40 hover:shadow-md hover:shadow-blue-100"
              >
                <p className="font-bold leading-snug text-slate-950">
                  {procedure.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {procedure.code}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-black text-primary-blue">
                    {formatMoney(procedure.defaultPrice)}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    {t("patientDetail.addVisitModal.add")}
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
  const t = useTranslations("treatments");
  const tPayments = useTranslations("payments.course");
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
  const [courseDetailTab, setCourseDetailTab] =
    useState<CourseDetailTab>("VISITS");
  const [isVisitPaymentModalOpen, setIsVisitPaymentModalOpen] = useState(false);

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
  const [courseCurrency, setCourseCurrency] = useState<Currency>("UZS");
  const [selectedCourseTeeth, setSelectedCourseTeeth] = useState<string[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const { data: visitCoursePayments } = useGetCoursePayments(
    selectedCourseId || undefined
  );

  // Boshqa kursga o'tilganda "Payments" sub-tab ochiq qolib ketmasin.
  useEffect(() => {
    setCourseDetailTab("VISITS");
  }, [selectedCourseId]);

  const [doctorId, setDoctorId] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [visitDate, setVisitDate] = useState(nowLocalIso);
  const [visitItems, setVisitItems] = useState<DraftVisitItem[]>([]);

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
      .map((toothNumber) =>
        t("patientDetail.visitHistory.itemTooth", { tooth: toothNumber })
      )
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
          conditionLabel(diagnosis as ToothCondition) || diagnosis
      )
      .join(", ");

    return `${teethText} ${
      diagnosisText || t("patientDetail.createCourseModal.defaultDiagnosisSuffix")
    }`;
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
      toast.warning(t("toasts.selectAtLeastOneTooth"));
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
      toast.success(t("toasts.chartSaved"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toasts.chartSaveFailed")));
    }
  }

  async function handleCreateCourse() {
    if (!selectedCourseTeeth.length) {
      toast.warning(t("toasts.selectTeethToTreat"));
      return;
    }

    const diagnosis =
      mainDiagnosis.trim() || buildDiagnosis(selectedCourseTeeth);

    if (!diagnosis) {
      toast.warning(t("toasts.enterDiagnosis"));
      return;
    }

    try {
      const created = await createCourse({
        patientId,
        mainDiagnosis: diagnosis,
        currency: courseCurrency,
      });

      setMainDiagnosis("");
      setCourseCurrency("UZS");
      setSelectedCourseId(getId(created));
      setIsCreateCourseModalOpen(false);
      setActiveTab("COURSE");
      toast.success(t("toasts.courseCreated"));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("toasts.courseCreateFailed"))
      );
    }
  }

  function handleAddProcedure(procedure: DentalProcedure) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      toast.error(t("toasts.procedureIdNotFound"));
      return;
    }

    const alreadyAdded = visitItems.some(
      (item) =>
        item.procedureId === procedureId &&
        item.toothNumber === selectedTooth
    );

    if (alreadyAdded) {
      toast.warning(t("toasts.procedureAlreadyAdded"));
      return;
    }

    const defaultPrice = Number(procedure.defaultPrice || 0);

    setVisitItems((previous) => [
      ...previous,
      {
        toothNumber: selectedTooth,
        procedureId,
        price: defaultPrice,
        defaultPrice,
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
        toast.warning(t("toasts.notImageFile", { file: file.name }));
        return;
      }

      if (file.size > MAX_XRAY_FILE_SIZE) {
        toast.warning(t("toasts.fileTooLarge", { file: file.name }));
        return;
      }

      validFiles.push(file);
    });

    setSelectedXrays((previous) => {
      const availableCount = MAX_XRAY_FILES - previous.length;

      if (availableCount <= 0) {
        toast.warning(
          t("toasts.maxXrayFiles", { count: MAX_XRAY_FILES })
        );
        return previous;
      }

      const acceptedFiles = validFiles.slice(0, availableCount);

      if (acceptedFiles.length < validFiles.length) {
        toast.warning(
          t("toasts.onlyXrayFilesAllowed", { count: MAX_XRAY_FILES })
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
      toast.warning(t("toasts.selectTreatmentCourse"));
      return;
    }

    if (isSelectedCourseCompleted) {
      toast.warning(t("toasts.courseCompletedCannotAddVisit"));
      return;
    }

    if (!doctorId) {
      toast.warning(t("toasts.selectDoctor"));
      return;
    }

    if (!doctorNotes.trim()) {
      toast.warning(t("toasts.enterDoctorNotes"));
      return;
    }

    if (!visitItems.length) {
      toast.warning(t("toasts.selectAtLeastOneProcedure"));
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
          items: visitItems.map((item) => ({
            toothNumber: item.toothNumber,
            procedureId: item.procedureId,
            price: item.price,
            completed: item.completed,
            note: item.note,
          })),
        },
      });

      visitCreated = true;

      // 3. URL'dagi yoki yangi visit response'idagi appointmentId.
      const resolvedAppointmentId =
        appointmentId || getAppointmentIdFromVisitResponse(visitResponse);

      // 4. Har bir rasm uchun POST /api/dental/images.
      if (uploadedXrays.length > 0) {
        if (!resolvedAppointmentId) {
          throw new Error(t("toasts.visitCreatedButAppointmentMissing"));
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
          ? t("toasts.visitAndXraysSaved")
          : appointmentId
            ? t("toasts.visitSaved")
            : t("toasts.treatmentStartedAppointmentCreated")
      );
    } catch (error) {
      console.error("Visit/Image save failed:", error);

      const message = getApiErrorMessage(
        error,
        t("toasts.visitSaveError")
      );

      if (visitCreated) {
        toast.error(
          t("toasts.visitCreatedButFollowupFailed", { message })
        );
      } else {
        toast.error(message);
      }
    }
  }

  async function handleCompleteCourse(courseId: string) {
    if (!window.confirm(t("patientDetail.course.confirmComplete"))) return;

    try {
      await completeCourse(courseId);

      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
        setVisitItems([]);
      }

      setCourseStatusFilter("COMPLETED");
      toast.success(t("toasts.courseCompleted"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toasts.courseCompleteFailed")));
    }
  }

  function openAddVisitModal(courseId: string) {
    const course = courses.find((item) => getId(item) === courseId);

    if (course?.status === "COMPLETED") {
      toast.warning(t("toasts.courseCompletedCannotAddVisit"));
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

  const conditionLabel = (condition: ToothCondition) =>
    CONDITION_KEYS[condition]
      ? t(`toothConditions.${CONDITION_KEYS[condition]}` as any)
      : condition;

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
          label={t("patientDetail.tabs.chart")}
          badge={chartProblemTeeth.length || undefined}
          onClick={() => setActiveTab("CHART")}
        />
        <TabButton
          active={activeTab === "COURSE"}
          icon={<ClipboardList size={16} />}
          label={t("patientDetail.tabs.course")}
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
            className="ml-auto inline-flex items-center gap-1.5 rounded-2xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-blue-dark"
          >
            <Plus size={16} />
            {t("patientDetail.tabs.openCourse")}
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
                  text={t("patientDetail.chart.loading")}
                />
              </div>
            ) : (
              <>
                {chart?.toothMap && (
                  <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <Sparkles size={15} className="text-blue-500" />
                      {t("patientDetail.chart.previousChartFound")}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalToothMap(chart.toothMap || {})
                      }
                      className="rounded-xl bg-primary-blue px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary-blue-dark"
                    >
                      {t("patientDetail.chart.load")}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: t("patientDetail.chart.chartStatus"),
                      value: chart
                        ? t("patientDetail.chart.chartExists")
                        : t("patientDetail.chart.chartNew"),
                      className: chart
                        ? "text-emerald-600"
                        : "text-primary-blue",
                    },
                    {
                      label: t("patientDetail.chart.markedTeeth"),
                      value: chartProblemTeeth.length,
                      className: "text-slate-950",
                    },
                    {
                      label: t("patientDetail.chart.selected"),
                      value: `#${selectedTooth}`,
                      className: "text-primary-blue",
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
                  {t("patientDetail.chart.selectedToothCaption")}
                </p>
                <h2 className="text-lg font-extrabold text-slate-950">
                  {t("patientDetail.chart.toothHeading", {
                    number: selectedTooth,
                  })}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                <Edit3 size={18} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <SectionLabel>{t("patientDetail.chart.diagnosis")}</SectionLabel>
                <select
                  value={selectedToothData.diagnoses?.[0] || ""}
                  onChange={(event) =>
                    updateSelectedTooth({
                      diagnoses: event.target.value
                        ? [event.target.value as ToothCondition]
                        : [],
                    })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
                >
                  <option value="">{t("patientDetail.chart.select")}</option>
                  {DIAGNOSIS_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {conditionLabel(condition)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <SectionLabel>{t("patientDetail.chart.state")}</SectionLabel>
                <select
                  value={selectedToothData.states?.[0] || ""}
                  onChange={(event) =>
                    updateSelectedTooth({
                      states: event.target.value
                        ? [event.target.value as ToothCondition]
                        : [],
                    })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
                >
                  <option value="">{t("patientDetail.chart.select")}</option>
                  {STATE_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {conditionLabel(condition)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <SectionLabel>{t("patientDetail.chart.note")}</SectionLabel>
                <textarea
                  value={selectedToothData.note || ""}
                  onChange={(event) =>
                    updateSelectedTooth({ note: event.target.value })
                  }
                  rows={4}
                  placeholder={t("patientDetail.chart.notePlaceholder")}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClearTooth}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  {t("patientDetail.chart.clear")}
                </button>

                <button
                  type="button"
                  onClick={handleSaveChart}
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-blue-dark disabled:opacity-60"
                >
                  {isCreating || isUpdating ? (
                    <DentalLoaderIcon size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {t("patientDetail.chart.save")}
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
                  {t("patientDetail.course.title")}
                </p>
                <h2 className="text-lg font-extrabold text-slate-950">
                  {t("patientDetail.course.listHeading")}
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} />
                {t("patientDetail.course.newCourseButton")}
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setCourseStatusFilter("ACTIVE")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  courseStatusFilter === "ACTIVE"
                    ? "bg-white text-primary-blue shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {t("patientDetail.course.statusActive")} ({activeCourses.length})
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
                {t("patientDetail.course.statusCompleted")} ({completedCourses.length})
              </button>
            </div>

            {coursesLoading ? (
              <DentalLoader
                fullScreen={false}
                text={t("patientDetail.course.loading")}
              />
            ) : visibleCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <ClipboardList
                  size={26}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  {t("patientDetail.course.noCourses")}
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
                      data-entity-id={courseId}
                      className={`overflow-hidden rounded-2xl border transition ${
                        selected
                          ? "border-primary-blue bg-blue-50/60 ring-1 ring-primary-blue/20"
                          : "border-slate-200 bg-white hover:border-primary-blue/30"
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
                            {completed
                              ? t("patientDetail.course.statusCompleted")
                              : t("patientDetail.course.statusActive")}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <ClipboardList size={13} />
                            {t("patientDetail.course.visitCount", {
                              count: course.visits?.length || 0,
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-primary-blue">
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
                            className="flex-1 rounded-xl bg-primary-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-blue-dark"
                          >
                            {t("patientDetail.course.addVisit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteCourse(courseId)}
                            disabled={isCompleting}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} />
                            {t("patientDetail.course.complete")}
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
                  {t("patientDetail.course.noCourseSelectedTitle")}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  {t("patientDetail.course.noCourseSelectedSubtitle")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t("patientDetail.createCourseModal.mainDiagnosisLabel")}
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
                      <span className="flex items-center gap-1 text-primary-blue">
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
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark"
                    >
                      <Plus size={16} />
                      {t("patientDetail.addVisitModal.title")}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCourseDetailTab("VISITS")}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                      courseDetailTab === "VISITS"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tPayments("tab.visits")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseDetailTab("PAYMENTS")}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                      courseDetailTab === "PAYMENTS"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tPayments("tab.payments")}
                  </button>
                </div>

                {courseDetailTab === "PAYMENTS" ? (
                  <div className="mt-4">
                    <CoursePaymentsPanel courseId={getId(selectedHistoryCourse)} />
                  </div>
                ) : selectedHistoryVisits.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <Calendar size={28} className="text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      {t("patientDetail.visitHistory.noVisits")}
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
                                    className="text-primary-blue"
                                  />
                                  {formatVisitDateTime(visit.visitDate)}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <Stethoscope size={13} />
                                  {getVisitDoctorName(visit, doctorsMap)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-blue ring-1 ring-slate-200">
                                  {formatMoney(getVisitTotal(visit))}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsVisitPaymentModalOpen(true)}
                                  className="inline-flex items-center gap-1 rounded-full border border-primary-blue/30 bg-primary-blue/10 px-3 py-1.5 text-xs font-black text-primary-blue transition hover:bg-primary-blue/20"
                                >
                                  <Plus size={12} />
                                  {tPayments("addButton")}
                                </button>
                              </div>
                            </div>

                            {visit.doctorNotes && (
                              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                  {t("patientDetail.addVisitModal.doctorNotesLabel")}
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
                                            {t("patientDetail.addVisitModal.itemLine", {
                                              tooth: item.toothNumber,
                                              note:
                                                item.procedureNameSnapshot ||
                                                item.note ||
                                                t(
                                                  "patientDetail.visitHistory.procedureFallback"
                                                ),
                                            })}
                                          </p>
                                          {item.completed && (
                                            <p className="mt-0.5 text-xs font-bold text-emerald-600">
                                              {t("patientDetail.visitHistory.itemCompleted")}
                                            </p>
                                          )}
                                        </div>
                                        <p className="shrink-0 text-sm font-black text-primary-blue">
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
                    {t("patientDetail.createCourseModal.title")}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {t("patientDetail.createCourseModal.subtitle")}
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
                      {t("patientDetail.createCourseModal.teethSelected", {
                        count: selectedCourseTeeth.length,
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMainDiagnosis(
                          buildDiagnosis(selectedCourseTeeth)
                        )
                      }
                      disabled={!selectedCourseTeeth.length}
                      className="rounded-xl bg-primary-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-blue-dark disabled:opacity-40"
                    >
                      {t("patientDetail.createCourseModal.autoFill")}
                    </button>
                  </div>

                  {chartProblemTeeth.length === 0 ? (
                    <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-500">
                      {t("patientDetail.createCourseModal.noTeethMarked")}
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
                                ? "bg-primary-blue text-white shadow-sm shadow-blue-200"
                                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-blue-50"
                            }`}
                          >
                            <span className="block text-lg">
                              #{item.toothNumber}
                            </span>
                            <span className="block text-xs opacity-80">
                              {conditionLabel(
                                item.diagnosis as ToothCondition
                              ) ||
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
                  <SectionLabel>{t("patientDetail.createCourseModal.mainDiagnosisLabel")}</SectionLabel>
                  <textarea
                    value={mainDiagnosis}
                    onChange={(event) =>
                      setMainDiagnosis(event.target.value)
                    }
                    placeholder={t(
                      "patientDetail.createCourseModal.mainDiagnosisPlaceholder"
                    )}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-primary-blue focus:bg-white"
                  />
                </div>

                <div>
                  <SectionLabel>{t("patientDetail.createCourseModal.currencyLabel")}</SectionLabel>
                  <select
                    value={courseCurrency}
                    onChange={(event) =>
                      setCourseCurrency(event.target.value as Currency)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-primary-blue focus:bg-white"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseModalOpen(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:flex-1"
                >
                  {t("patientDetail.createCourseModal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateCourse}
                  disabled={
                    isCreatingCourse || !selectedCourseTeeth.length
                  }
                  className="w-full rounded-2xl bg-primary-blue py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-blue-dark disabled:opacity-60 sm:w-auto sm:flex-1"
                >
                  {isCreatingCourse
                    ? t("patientDetail.createCourseModal.creating")
                    : t("patientDetail.createCourseModal.create")}
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
                    {t("patientDetail.addVisitModal.title")}
                  </h2>
                  {selectedCourse && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {t("patientDetail.addVisitModal.courseLabel")}:{" "}
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
                  onUpdateVisitItemPrice={(index, price) =>
                    setVisitItems((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, price: Number.isNaN(price) ? 0 : price }
                          : item
                      )
                    )
                  }
                  onResetVisitItemPrice={(index) =>
                    setVisitItems((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, price: item.defaultPrice }
                          : item
                      )
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

      {isVisitPaymentModalOpen &&
        selectedCourseId &&
        typeof document !== "undefined" &&
        createPortal(
          <AddPaymentModal
            courseId={selectedCourseId}
            defaultCurrency={visitCoursePayments?.currency ?? "UZS"}
            remainingBalance={visitCoursePayments?.remainingBalance ?? 0}
            onClose={() => setIsVisitPaymentModalOpen(false)}
            onCreated={() => setIsVisitPaymentModalOpen(false)}
          />,
          document.body
        )}
    </div>
  );
}
