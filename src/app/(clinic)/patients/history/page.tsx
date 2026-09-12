"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Coins,
  ExternalLink,
  Phone,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  Wallet,
} from "lucide-react";

import DentalLoader, { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useSearchPatientByPhone } from "@/src/features/patients/hooks/usePatients";
import { useTreatmentCourses } from "@/src/features/treatments/hooks/useTreatmentCourses";
import { useGetCoursePayments } from "@/src/features/treatment-payments/hooks/useTreatmentPayments";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { CoursePaymentsPanel } from "@/src/features/treatments/components/CoursePaymentsPanel";
import { VisitXrayGallery, getVisitImages } from "@/src/features/treatments/components/VisitXrayGallery";
import { formatPaymentMoney } from "@/src/features/treatment-payments/format";
import { useAuthStore } from "@/src/store/auth.store";
import { Gender } from "@/src/lib/enums/enums.types";
import type { Patient } from "@/src/types/patient.types";
import type { TreatmentCourse, TreatmentVisit } from "@/src/types/treatment-course.types";
import type { Doctor } from "@/src/types/doctor.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  let localNumber = digits;
  if (localNumber.startsWith("998")) localNumber = localNumber.slice(3);
  if (localNumber.startsWith("0")) localNumber = localNumber.slice(1);
  localNumber = localNumber.slice(0, 9);
  return localNumber ? `+998${localNumber}` : "+998";
}

function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getCourseId(course: TreatmentCourse): string {
  return course.id || course._id || "";
}

function getInitials(patient: Patient): string {
  return `${patient.firstName?.[0] || ""}${patient.lastName?.[0] || ""}`.toUpperCase() || "?";
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatBirthDate(value?: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return "—";
  return `${String(date.day).padStart(2, "0")}.${String(date.month).padStart(2, "0")}.${date.year}`;
}

function formatPatientAge(value?: string | null): string {
  const birth = parseDateOnly(value);
  if (!birth) return "—";
  const today = new Date();
  let years = today.getFullYear() - birth.year;
  const birthdayNotPassed =
    today.getMonth() + 1 < birth.month ||
    (today.getMonth() + 1 === birth.month && today.getDate() < birth.day);
  if (birthdayNotPassed) years -= 1;
  return years >= 0 ? String(years) : "—";
}

function getCourseDurationDays(start?: string | null, end?: string | null): number | null {
  const startDate = parseDateOnly(start);
  if (!startDate) return null;

  const endDate = end ? parseDateOnly(end) : null;
  const startMs = Date.UTC(startDate.year, startDate.month - 1, startDate.day);
  const today = new Date();
  const endMs = endDate
    ? Date.UTC(endDate.year, endDate.month - 1, endDate.day)
    : Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.max(0, Math.round((endMs - startMs) / 86_400_000));
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

function sortVisitsDesc(visits: TreatmentVisit[]): TreatmentVisit[] {
  return [...visits].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );
}

function getVisitTotal(visit: TreatmentVisit): number {
  if (typeof visit.totalPrice === "number") return visit.totalPrice;
  if (typeof visit.totalAmount === "number") return visit.totalAmount;
  return (visit.items || []).reduce(
    (sum, item) => sum + Number(item.priceSnapshot ?? item.price ?? 0),
    0
  );
}

function getVisitToothNumbers(visit: TreatmentVisit): string[] {
  const numbers = (visit.items || [])
    .map((item) => item.toothNumber)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(numbers));
}

function getId(item?: { id?: string; _id?: string } | null): string {
  return item?.id || item?._id || "";
}

function getDoctorName(doctor?: Doctor | null): string {
  if (!doctor) return "";
  return `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
}

// ---------------------------------------------------------------------------
// Tooth badge — tooth-shaped icon with the tooth number inside it
// ---------------------------------------------------------------------------

function ToothBadge({ toothNumber }: { toothNumber: string }) {
  return (
    <span
      title={`#${toothNumber}`}
      className="relative inline-flex h-10 w-9 shrink-0 items-center justify-center text-primary-blue"
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full" fill="currentColor" aria-hidden="true">
        <path d="M12 2c-1.1 0-2 .5-2.5 1.3C9 2.5 8.1 2 7 2 4.8 2 3 4 3 6.8c0 2 .7 3.9 1.3 5.6.5 1.5 1 2.9 1.2 4.3.2 1.6.7 3.3 2.5 3.3s2.3-1.7 2.5-3.3c.1-.7.2-1.4.5-2.1.3.7.4 1.4.5 2.1.2 1.6.7 3.3 2.5 3.3s2.3-1.7 2.5-3.3c.2-1.4.7-2.8 1.2-4.3C20.3 10.7 21 8.8 21 6.8 21 4 19.2 2 17 2c-1.1 0-2 .5-2.5 1.3C14 2.5 13.1 2 12 2z" />
      </svg>
      <span className="relative -translate-y-0.5 text-[11px] font-black leading-none text-white">
        {toothNumber}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Course summary card — shows balance without opening the full panel
// ---------------------------------------------------------------------------

function CourseSummaryCard({
  course,
  orderNumber,
  active,
  onSelect,
}: {
  course: TreatmentCourse;
  orderNumber: number;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("payments.lookup");
  const courseId = getCourseId(course);
  const { data, isLoading } = useGetCoursePayments(courseId);

  const currency = data?.currency ?? course.currency ?? "UZS";
  const totalAmount = data?.totalAmount ?? course.totalCoursePrice ?? 0;
  const paidAmount = data?.paidAmount ?? 0;
  const remainingBalance = data?.remainingBalance;
  const isCompleted = course.status === "COMPLETED";

  const paymentStatus: "PAID" | "PARTIAL" | "UNPAID" | null = isLoading
    ? null
    : totalAmount > 0 && (remainingBalance ?? totalAmount) <= 0
      ? "PAID"
      : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  const visits = course.visits || [];
  const sortedVisits = sortVisitsDesc(visits);
  const lastVisitDate = sortedVisits[0]?.visitDate;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        active
          ? "border-primary-blue bg-primary-blue/5 shadow-sm shadow-primary-blue/10"
          : "border-slate-200 bg-white hover:border-primary-blue/30 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
              active ? "bg-primary-blue text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {orderNumber}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {course.mainDiagnosis || t("courses.untitled")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  isCompleted ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isCompleted ? t("courses.status.COMPLETED") : t("courses.status.ACTIVE")}
              </span>

              {paymentStatus && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700"
                      : paymentStatus === "PARTIAL"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {t(`courses.paymentStatus.${paymentStatus}`)}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight size={18} className={active ? "text-primary-blue" : "text-slate-300"} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <CalendarDays size={13} className="shrink-0 text-primary-blue" />
        {visits.length === 0
          ? t("courses.noVisitsYet")
          : t("courses.visitsSummary", {
              count: visits.length,
              date: formatVisitDateTime(lastVisitDate).split(",")[0],
            })}
      </div>

      {course.startDate && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <CalendarRange size={13} className="shrink-0 text-primary-blue" />
          {formatBirthDate(course.startDate)}
          {" – "}
          {course.endDate ? formatBirthDate(course.endDate) : t("courses.ongoing")}
          <span className="text-slate-300">·</span>
          {t("courses.durationDays", { count: getCourseDurationDays(course.startDate, course.endDate) ?? 0 })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            {t("courses.total")}
          </p>
          <p className="text-sm font-black text-slate-800">
            {isLoading ? "…" : formatPaymentMoney(totalAmount, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            {t("courses.remaining")}
          </p>
          <p
            className={`text-sm font-black ${
              !isLoading && (remainingBalance ?? 0) > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {isLoading ? "…" : formatPaymentMoney(remainingBalance ?? 0, currency)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PatientPaymentLookupPage() {
  const t = useTranslations("payments.lookup");
  const tPatients = useTranslations("patients");
  const isReceptionist = useAuthStore((state) => state.isReceptionist());

  const [phone, setPhone] = useState("+998");
  const [attempted, setAttempted] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [detailTab, setDetailTab] = useState<"VISITS" | "PAYMENTS">("VISITS");

  const { data: allStaff = [] } = useGetDoctors();
  const doctorsMap = new Map<string, Doctor>();
  allStaff.forEach((staff) => {
    const id = getId(staff);
    if (id) doctorsMap.set(id, staff);
  });

  const phoneDigits = extractDigits(phone);
  const shouldSearch = attempted && phoneDigits.length === 12;

  const { data: results = [], isLoading: isSearching } = useSearchPatientByPhone(
    shouldSearch ? phone : null
  );
  const patient = results[0] ?? null;

  const { courses, isLoading: coursesLoading } = useTreatmentCourses(patient?.id);

  // Ro'yxat sanasi bo'yicha KAMAYISH tartibida — eng oxirgi kurs tepada.
  // Tartib raqami shu ko'rinish tartibiga mos: tepadagi #1.
  const sortedCourses = [...courses].sort((a, b) => {
    const aTime = new Date(a.startDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.startDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const courseOrderNumbers = new Map<string, number>();
  sortedCourses.forEach((course, index) => {
    courseOrderNumbers.set(getCourseId(course), index + 1);
  });

  const totalCourses = sortedCourses.length;
  const totalVisits = sortedCourses.reduce(
    (sum, course) => sum + (course.visits?.length ?? 0),
    0
  );

  // Kurs ro'yxati o'zgarganda (yangi bemor, yangi kurs) saqlangan tanlov
  // endi mavjud bo'lmasligi mumkin — shu holda birinchi kursga tushamiz.
  // Effect o'rniga render vaqtida hisoblanadi, chunki bu faqat joriy
  // render inputlaridan kelib chiqadigan hosila qiymat.
  const effectiveSelectedCourseId = sortedCourses.some(
    (course) => getCourseId(course) === selectedCourseId
  )
    ? selectedCourseId
    : getCourseId(sortedCourses[0] ?? ({} as TreatmentCourse));

  const selectedCourse =
    sortedCourses.find((course) => getCourseId(course) === effectiveSelectedCourseId) ?? null;
  const selectedCourseVisits = sortVisitsDesc(selectedCourse?.visits ?? []);

  function handlePhoneChange(value: string) {
    setPhone(formatPhoneNumber(value));
    setAttempted(false);
    setSelectedCourseId("");
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phoneDigits.length !== 12) return;
    setAttempted(true);
  }

  const notFound = shouldSearch && !isSearching && !patient;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Search bar */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={t("search.placeholder")}
              maxLength={13}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-lg font-bold tracking-wide text-slate-900 outline-none transition focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/10"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || phoneDigits.length !== 12}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-6 py-3.5 text-sm font-black text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? <DentalLoaderIcon size={18} className="text-white" /> : <Search size={18} />}
            {isSearching ? t("search.searching") : t("search.button")}
          </button>
        </form>
      </section>

      {/* Empty prompt */}
      {!shouldSearch && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
            <Search size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-950">{t("empty.title")}</h3>
          <p className="max-w-sm text-sm text-slate-500">{t("empty.subtitle")}</p>
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-16 text-center">
          <AlertCircle size={32} className="text-amber-600" />
          <h3 className="text-lg font-black text-amber-900">{t("notFound.title")}</h3>
          <p className="max-w-sm text-sm text-amber-700">{t("notFound.subtitle")}</p>
          <Link
            href="/patients"
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-700"
          >
            <Plus size={16} />
            {t("notFound.createLink")}
          </Link>
        </div>
      )}

      {/* Found patient */}
      {patient && (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary-blue/[0.06]" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-blue to-primary-blue-dark text-lg font-black text-white shadow-md shadow-blue-200">
                  {getInitials(patient) || <UserRound size={26} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-950">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {patient.phoneNumber || patient.phone}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("patientCard.birthDate")}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                    {formatBirthDate(patient.birthDate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("courses.totalCourses")}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                    {totalCourses}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("courses.totalVisits")}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                    {totalVisits}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("patientCard.age")}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                    {formatPatientAge(patient.birthDate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("patientCard.gender")}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                    {patient.gender === Gender.MALE
                      ? tPatients("gender.male")
                      : patient.gender === Gender.FEMALE
                        ? tPatients("gender.female")
                        : "—"}
                  </p>
                </div>
              </div>
            </div>

            {!isReceptionist && (
              <div className="relative mt-5 flex justify-end border-t border-slate-100 pt-4">
                <Link
                  href={`/treatments/${patient.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-blue hover:underline"
                >
                  <Stethoscope size={15} />
                  {t("patientCard.openFullChart")}
                  <ExternalLink size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Courses + payments */}
          {coursesLoading ? (
            <DentalLoader fullScreen={false} text={t("courses.loading")} />
          ) : sortedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center">
              <Wallet size={28} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">{t("courses.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <div className="space-y-3">
                <h3 className="px-1 text-xs font-black uppercase tracking-wide text-slate-400">
                  {t("courses.title")}
                </h3>
                {sortedCourses.map((course) => {
                  const courseId = getCourseId(course);
                  return (
                    <CourseSummaryCard
                      key={courseId}
                      course={course}
                      orderNumber={courseOrderNumbers.get(courseId) ?? 0}
                      active={courseId === effectiveSelectedCourseId}
                      onSelect={() => setSelectedCourseId(courseId)}
                    />
                  );
                })}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                {!effectiveSelectedCourseId ? (
                  <p className="py-10 text-center text-sm font-semibold text-slate-400">
                    {t("courses.selectPrompt")}
                  </p>
                ) : (
                  <>
                    <div className="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setDetailTab("VISITS")}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                          detailTab === "VISITS"
                            ? "bg-white text-primary-blue shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <CalendarDays size={16} />
                        {t("courses.detail.tabs.visits")}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-xs font-extrabold ${
                            detailTab === "VISITS" ? "bg-primary-blue/10 text-primary-blue" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {selectedCourseVisits.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailTab("PAYMENTS")}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                          detailTab === "PAYMENTS"
                            ? "bg-white text-primary-blue shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Coins size={16} />
                        {t("courses.detail.tabs.payments")}
                      </button>
                    </div>

                    {detailTab === "VISITS" ? (
                      selectedCourseVisits.length === 0 ? (
                        <EmptyState icon={CalendarDays} message={t("courses.detail.visitsEmpty")} />
                      ) : (
                        <div className="space-y-2.5">
                          {selectedCourseVisits.map((visit, index) => {
                            const doctor = doctorsMap.get(visit.doctorId);
                            const doctorName =
                              getDoctorName(doctor) || t("courses.detail.unknownDoctor");
                            const currency = selectedCourse?.currency ?? "UZS";
                            const toothNumbers = getVisitToothNumbers(visit);
                            const visitImages = getVisitImages(visit);

                            return (
                              <div
                                key={visit.visitId || `${visit.visitDate}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-white p-3.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                    <CalendarDays size={15} className="shrink-0 text-primary-blue" />
                                    {formatVisitDateTime(visit.visitDate)}
                                  </div>
                                  <span className="text-sm font-black text-slate-900">
                                    {formatPaymentMoney(getVisitTotal(visit), currency)}
                                  </span>
                                </div>

                                {toothNumbers.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {toothNumbers.map((toothNumber) => (
                                      <ToothBadge key={toothNumber} toothNumber={toothNumber} />
                                    ))}
                                  </div>
                                )}

                                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                  <Stethoscope size={13} className="shrink-0" />
                                  {doctorName}
                                </p>
                                {visit.doctorNotes && (
                                  <p className="mt-1.5 truncate text-xs text-slate-400">
                                    {visit.doctorNotes}
                                  </p>
                                )}

                                <VisitXrayGallery images={visitImages} />
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <CoursePaymentsPanel courseId={effectiveSelectedCourseId} />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
