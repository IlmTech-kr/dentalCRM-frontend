"use client";

/**
 * File: src/app/(clinic)/treatments/[patientId]/page.tsx
 *
 * Fixes:
 * 1. COMPLETED course ga visit qo'sha olmaslik
 * 2. Note textarea re-render muammosi (VisitPanel extracted)
 * 3. "Visit qo'shish" tab olib tashlandi — faqat modal
 * 4. Modal chiroyliroq
 * 5. Modal z-index 9999 — error toast ustida ko'rinadi
 * 6. appointmentId endi ixtiyoriy — Patients sahifasidan to'g'ridan-to'g'ri
 *    kirilganda ("Molajani boshlash") appointmentId yo'q bo'ladi va backend
 *    doctorId + joriy vaqt asosida appointmentni avtomatik yaratadi.
 * 7. DOCTOR rolida kirgan foydalanuvchi uchun "Shifokor" maydoni endi
 *    select emas — o'zi avtomatik tanlanadi va o'zgartirib bo'lmaydi.
 *    Boshqa rollar (admin, receptionist, assistant) uchun select qoladi.
 * 8. Visit tarixida narx "0 so'm" va shifokor o'rniga ID chiqishi tuzatildi —
 *    backend item narxini `price` emas `priceSnapshot` deb qaytaradi, va
 *    visit ichida tayyor doctor obyekti kelmaydi (faqat doctorId) — endi
 *    doctors ro'yxatidan (doctorsMap) nomi qidirib topiladi.
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ClipboardList,
  Edit3,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Dental3DChart } from "@/src/features/treatments/components/Dental3DChart";
import { useDentalChart } from "@/src/features/treatments/hooks/useDentalChart";
import { useDentalProcedures } from "@/src/features/treatments/hooks/useDentalProcedures";
import { useTreatmentCourses } from "@/src/features/treatments/hooks/useTreatmentCourses";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { useToast } from "@/src/lib/hooks/Usetoast";
import DentalLoader from "@/src/components/ui/DentalLoader";
import { Role } from "@/src/lib/enums/enums.types";
import { useAuthStore } from "@/src/store/auth.store";
import type { ToothItem, ToothMap } from "@/src/types/dental-chart.types";
import { ToothCondition } from "@/src/lib/enums/enums.types";
import type { DentalProcedure } from "@/src/types/dental-procedure.types";
import type { TreatmentVisitItem } from "@/src/types/treatment-course.types";
import { getPatientById } from "@/src/features/patients/patient.service";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type PatientInfo = {
  id?: string; _id?: string;
  firstName?: string; lastName?: string; fullName?: string;
  phone?: string; phoneNumber?: string;
  birthDate?: string; dateOfBirth?: string;
  status?: string; active?: boolean;
};

type TreatmentTab = "CHART" | "COURSE";
type CourseStatusFilter = "ACTIVE" | "COMPLETED";

const DIAGNOSIS_OPTIONS: ToothCondition[] = [
  ToothCondition.CARIES, ToothCondition.PULPITIS,
  ToothCondition.GINGIVITIS, ToothCondition.CRACK,
];

const STATE_OPTIONS: ToothCondition[] = [
  ToothCondition.HEALTHY, ToothCondition.MISSING, ToothCondition.EXTRACTED,
  ToothCondition.FILLING, ToothCondition.CROWN, ToothCondition.IMPLANT,
  ToothCondition.BRIDGE, ToothCondition.ROOT_CANAL,
];

const LABELS: Record<ToothCondition, string> = {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyTooth(): ToothItem { return { diagnoses: [], states: [], note: "" }; }
function getId(item?: { id?: string; _id?: string } | null) { return item?.id || item?._id || ""; }
function formatMoney(v?: number) {
  return v ? new Intl.NumberFormat("uz-UZ").format(v) + " so'm" : "0 so'm";
}
function calculateAge(birthDate?: string) {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return String(age);
}
function formatVisitDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${d}.${m}.${date.getFullYear()}, ${h}:${min}`;
}

/**
 * Bitta visit item narxini o'qiydi. Backend hozircha narxni
 * `priceSnapshot` deb qaytaradi (eski `price` fieldi ham bo'lishi mumkin —
 * shuning uchun ikkalasi ham tekshiriladi).
 */
function getItemPrice(item: any): number {
  return Number(item?.priceSnapshot ?? item?.price ?? 0);
}

/**
 * Bitta visitning umumiy narxi. Avval tayyor `totalPrice`/`totalAmount`
 * fieldlarini tekshiradi, bo'lmasa itemlar narxini (priceSnapshot) yig'adi.
 */
function getVisitTotal(visit: any) {
  if (typeof visit?.totalPrice === "number") return visit.totalPrice;
  if (typeof visit?.totalAmount === "number") return visit.totalAmount;
  return (visit?.items || []).reduce((s: number, i: any) => s + getItemPrice(i), 0);
}

/**
 * Visit ichida tayyor doctor obyekti kelmaydi — faqat `doctorId` bor.
 * Shuning uchun `doctorsMap` orqali ismi qidirib topiladi; topilmasa
 * (masalan doctor keyinchalik o'chirilgan bo'lsa) ID ko'rsatiladi.
 */
function getVisitDoctorName(visit: any, doctorsMap?: Map<string, any>) {
  const embeddedDoctor = visit?.doctor || visit?.doctorInfo;
  if (embeddedDoctor) {
    const full = [embeddedDoctor.firstName, embeddedDoctor.lastName].filter(Boolean).join(" ").trim();
    if (visit?.doctorName || embeddedDoctor.fullName || full) {
      return visit.doctorName || embeddedDoctor.fullName || full;
    }
  }
  const fromMap = doctorsMap?.get(visit?.doctorId);
  if (fromMap) {
    const full = [fromMap.firstName, fromMap.lastName].filter(Boolean).join(" ").trim();
    return fromMap.fullName || full || visit?.doctorId || "-";
  }
  return visit?.doctorId || "-";
}
function nowLocalIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function getFullName(person?: { firstName?: string; lastName?: string; fullName?: string } | null) {
  if (!person) return "";
  return person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim();
}

// ---------------------------------------------------------------------------
// PatientInfoCard
// ---------------------------------------------------------------------------

function PatientInfoCard({ patient, isLoading }: { patient?: PatientInfo; isLoading: boolean }) {
  const name = patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim();
  const phone = patient?.phoneNumber || patient?.phone || "—";
  const age = calculateAge(patient?.birthDate || (patient as any)?.dateOfBirth);
  const isActive = patient?.active !== false && patient?.status !== "INACTIVE";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#35a8f5]/10 text-[#35a8f5]">
            <UserRound size={32} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-dark-navy">{name || "Bemor"}</h1>
            <p className="mt-1 font-semibold text-slate-600">{phone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs text-text-light">Yoshi</p>
            <p className="font-extrabold text-dark-navy">{age}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs text-text-light">Holat</p>
            <span className={`text-xs font-bold ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabBtn
// ---------------------------------------------------------------------------

function TabBtn({ active, icon, label, badge, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
        active ? "bg-[#35a8f5] text-white shadow-sm" : "border border-border-color bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon} {label}
      {badge !== undefined && (
        <span className={`rounded-full px-1.5 py-0.5 text-xs font-extrabold ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DoctorSelect
// ---------------------------------------------------------------------------

function DoctorSelect({ value, onChange, doctors }: {
  value: string; onChange: (id: string) => void; doctors: any[];
}) {
  const getName = (d: any) =>
    d?.fullName || `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Doctor";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border-color bg-white px-4 py-3 text-sm font-semibold text-dark-navy outline-none focus:border-[#35a8f5] focus:ring-2 focus:ring-[#35a8f5]/20"
    >
      <option value="">Doctor tanlang</option>
      {doctors.map((d) => {
        const id = d.id || d._id;
        return <option key={id} value={id}>{getName(d)}</option>;
      })}
    </select>
  );
}

// ---------------------------------------------------------------------------
// VisitPanel — EXTRACTED outside page component (fixes textarea re-render)
// ---------------------------------------------------------------------------

type VisitPanelProps = {
  activeCourses: any[];
  selectedCourseId: string;
  onCourseChange: (id: string) => void;
  doctors: any[];
  doctorId: string;
  onDoctorChange: (id: string) => void;
  isDoctorLocked: boolean;
  lockedDoctorName: string;
  visitDate: string;
  onVisitDateChange: (v: string) => void;
  doctorNotes: string;
  onDoctorNotesChange: (v: string) => void;
  selectedTooth: string;
  onToothChange: (t: string) => void;
  treatmentTeeth: string[];
  visitItems: TreatmentVisitItem[];
  onRemoveItem: (idx: number) => void;
  onSave: () => void;
  isSaving: boolean;
  isCompleted: boolean;
  isNewAppointment: boolean;
  procedures: DentalProcedure[];
  proceduresLoading: boolean;
  procedureSearch: string;
  onProcedureSearch: (v: string) => void;
  onAddProcedure: (p: DentalProcedure) => void;
  onGoToChart: () => void;
};

function VisitPanel({
  activeCourses, selectedCourseId, onCourseChange,
  doctors, doctorId, onDoctorChange, isDoctorLocked, lockedDoctorName,
  visitDate, onVisitDateChange,
  doctorNotes, onDoctorNotesChange,
  selectedTooth, onToothChange, treatmentTeeth,
  visitItems, onRemoveItem, onSave, isSaving, isCompleted, isNewAppointment,
  procedures, proceduresLoading, procedureSearch, onProcedureSearch, onAddProcedure,
  onGoToChart,
}: VisitPanelProps) {
  const totalPrice = visitItems.reduce((s, i) => s + i.price, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: form */}
      <div className="space-y-4">
        {/* Course */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Course tanlang</label>
          <select
            value={selectedCourseId}
            onChange={(e) => onCourseChange(e.target.value)}
            className="w-full rounded-xl border border-border-color bg-white px-4 py-3 text-sm outline-none focus:border-[#35a8f5] focus:ring-2 focus:ring-[#35a8f5]/20"
          >
            <option value="">Course tanlang</option>
            {activeCourses.map((c) => (
              <option key={getId(c)} value={getId(c)}>{c.mainDiagnosis}</option>
            ))}
          </select>
        </div>

        {/* Doctor — DOCTOR rolida kirgan foydalanuvchi uchun o'zi avtomatik
            tanlanadi va tahrirlanmaydi; boshqa rollar uchun select ko'rinadi. */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Shifokor</label>
          {isDoctorLocked ? (
            <div className="flex items-center gap-2 rounded-xl border border-border-color bg-slate-50 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#35a8f5]/10 text-[#35a8f5]">
                <UserRound size={16} />
              </div>
              <span className="text-sm font-semibold text-dark-navy">
                {lockedDoctorName || "Siz"}
              </span>
              <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                Siz
              </span>
            </div>
          ) : (
            <DoctorSelect value={doctorId} onChange={onDoctorChange} doctors={doctors} />
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Tashrif sanasi</label>
          <input
            type="datetime-local"
            value={visitDate}
            onChange={(e) => onVisitDateChange(e.target.value)}
            className="w-full rounded-xl border border-border-color bg-white px-4 py-3 text-sm outline-none focus:border-[#35a8f5] focus:ring-2 focus:ring-[#35a8f5]/20"
          />
        </div>

        {/* Notes — key prop prevents re-mount */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Shifokor izohi</label>
          <textarea
            value={doctorNotes}
            onChange={(e) => onDoctorNotesChange(e.target.value)}
            placeholder="Kanal doimiy material bilan to'ldirildi..."
            rows={4}
            className="w-full resize-none rounded-xl border border-border-color bg-white px-4 py-3 text-sm outline-none focus:border-[#35a8f5] focus:ring-2 focus:ring-[#35a8f5]/20"
          />
        </div>

        {/* Tooth selector */}
        <div className="rounded-xl border border-border-color bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Davolanadigan tish</p>
            <span className="rounded-lg bg-[#35a8f5]/10 px-2 py-1 text-xs font-bold text-[#35a8f5]">
              #{selectedTooth}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {treatmentTeeth.length === 0 ? (
              <button
                type="button"
                onClick={onGoToChart}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#35a8f5] ring-1 ring-border-color hover:bg-blue-50"
              >
                Chartdan tish tanlash →
              </button>
            ) : (
              treatmentTeeth.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToothChange(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                    selectedTooth === t
                      ? "bg-[#35a8f5] text-white"
                      : "bg-white text-slate-700 ring-1 ring-border-color hover:bg-blue-50"
                  }`}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Visit items */}
        <div className="rounded-xl border border-border-color bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Tanlangan muolajalar</p>
            <p className="text-sm font-extrabold text-[#35a8f5]">{formatMoney(totalPrice)}</p>
          </div>
          {visitItems.length === 0 ? (
            <p className="text-sm text-slate-400">Hali muolaja tanlanmadi</p>
          ) : (
            <div className="space-y-2">
              {visitItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
                  <div>
                    <p className="text-sm font-bold text-dark-navy">{item.toothNumber}-tish</p>
                    <p className="text-xs text-slate-500">{item.note}</p>
                    <p className="text-xs font-bold text-[#35a8f5]">{formatMoney(item.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(i)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info: yangi appointment avtomatik yaratiladi */}
        {!isCompleted && isNewAppointment && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-700">
              Bu visit uchun appointment hali mavjud emas — saqlanganda joriy vaqt bilan avtomatik yaratiladi.
            </p>
          </div>
        )}

        {/* Save button */}
        {isCompleted ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Lock size={18} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">Bu kurs yakunlangan — visit qo'sha olmaysiz</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || visitItems.length === 0}
            className="w-full rounded-xl bg-[#35a8f5] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saqlanmoqda..." : visitItems.length === 0 ? "Avval muolaja tanlang" : "✓ Visitni saqlash"}
          </button>
        )}
      </div>

      {/* Right: procedures */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            Muolajalar — <span className="text-[#35a8f5]">{selectedTooth}-tish</span>
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={procedureSearch}
              onChange={(e) => onProcedureSearch(e.target.value)}
              placeholder="Qidirish..."
              className="rounded-lg border border-border-color bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#35a8f5]"
            />
          </div>
        </div>

        {proceduresLoading ? (
          <DentalLoader fullScreen={false} text="Muolajalar yuklanmoqda..." />
        ) : procedures.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-bold text-amber-800">Muolaja topilmadi</p>
            <p className="mt-1 text-sm text-amber-700">Avval muolaja qo'shing.</p>
            <Link href="/procedures" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">
              <Plus size={14} /> Muolajalar sahifasi
            </Link>
          </div>
        ) : (
          <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {procedures.map((procedure) => (
              <button
                key={getId(procedure)}
                type="button"
                onClick={() => onAddProcedure(procedure)}
                className="rounded-xl border border-border-color bg-white p-4 text-left transition hover:border-[#35a8f5]/40 hover:bg-blue-50 hover:shadow-sm"
              >
                <p className="font-bold text-dark-navy">{procedure.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{procedure.code}</p>
                <p className="mt-2 text-sm font-bold text-[#35a8f5]">{formatMoney(procedure.defaultPrice)}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600">+ Qo'shish</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TreatmentPatientPage() {
  const params = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();
  const toast = useToast();

  const patientId = params.patientId;
  // appointmentId endi IXTIYORIY — bo'lmasa ("Molajani boshlash" orqali
  // Patients sahifasidan kirilgan bo'lsa), backend avtomatik yaratadi.
  const appointmentId = searchParams.get("appointmentId") || "";

  // Joriy foydalanuvchi — DOCTOR bo'lsa, "Shifokor" maydoni o'zi bilan qulflanadi.
  const currentUser = useAuthStore((s) => s.user);
  const isDoctorUser = useAuthStore((s) => s.isDoctor());
  const currentUserId = (currentUser as any)?.id || (currentUser as any)?._id || "";
  const currentUserName = getFullName(currentUser as any);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientById(patientId),
    enabled: Boolean(patientId),
    staleTime: 1000 * 60,
  });

  const { data: allStaff = [] } = useGetDoctors();
  const doctors = allStaff.filter((s: any) => s.roles?.includes(Role.DOCTOR));

  /**
   * Visit tarixida faqat `doctorId` keladi (tayyor doctor obyekti yo'q),
   * shuning uchun ismni shu map orqali qidiramiz.
   */
  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();
    allStaff.forEach((d: any) => {
      const id = getId(d);
      if (id) map.set(id, d);
    });
    return map;
  }, [allStaff]);

  const [activeTab, setActiveTab] = useState<TreatmentTab>("CHART");
  const [courseStatusFilter, setCourseStatusFilter] = useState<CourseStatusFilter>("ACTIVE");
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);

  const { chart, isLoading: chartLoading, createChart, updateChart, isCreating, isUpdating } = useDentalChart(patientId);
  const {
    courses, isLoading: coursesLoading,
    createCourse, addVisit, completeCourse,
    isCreating: isCreatingCourse, isAddingVisit, isCompleting,
  } = useTreatmentCourses(patientId);

  const [procedureSearch, setProcedureSearch] = useState("");
  const { procedures, isLoading: proceduresLoading } = useDentalProcedures(procedureSearch);

  // Chart state
  const [selectedTooth, setSelectedTooth] = useState("16");
  const [localToothMap, setLocalToothMap] = useState<ToothMap>({});

  // Course state
  const [mainDiagnosis, setMainDiagnosis] = useState("");
  const [selectedCourseTeeth, setSelectedCourseTeeth] = useState<string[]>([]);

  // Visit state
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [visitDate, setVisitDate] = useState(nowLocalIso);
  const [visitItems, setVisitItems] = useState<TreatmentVisitItem[]>([]);

  // DOCTOR rolida kirgan foydalanuvchi uchun doctorId har doim o'zinikiga tenglashadi.
  useEffect(() => {
    if (isDoctorUser && currentUserId) {
      setDoctorId(currentUserId);
    }
  }, [isDoctorUser, currentUserId]);

  const toothMap: ToothMap = useMemo(
    () => Object.keys(localToothMap).length > 0 ? localToothMap : chart?.toothMap || {},
    [localToothMap, chart]
  );

  const selectedToothData = toothMap[selectedTooth] || emptyTooth();
  const activeCourses = courses.filter((c) => c.status !== "COMPLETED");
  const completedCourses = courses.filter((c) => c.status === "COMPLETED");
  const visibleCourses = courseStatusFilter === "ACTIVE" ? activeCourses : completedCourses;
  const selectedCourse = courses.find((c) => getId(c) === selectedCourseId);
  const isSelectedCourseCompleted = selectedCourse?.status === "COMPLETED";

  const selectedHistoryCourse =
    visibleCourses.find((c) => getId(c) === selectedCourseId) || visibleCourses[0] || null;
  const selectedHistoryVisits = selectedHistoryCourse?.visits || [];

  const chartProblemTeeth = useMemo(
    () =>
      Object.entries(toothMap)
        .filter(([, item]) => item.diagnoses?.length || item.states?.length || item.note?.trim())
        .map(([toothNumber, item]) => ({
          toothNumber,
          diagnosis: item.diagnoses?.[0] || "",
          state: item.states?.[0] || "",
          note: item.note || "",
        }))
        .sort((a, b) => Number(a.toothNumber) - Number(b.toothNumber)),
    [toothMap]
  );

  const treatmentTeeth = useMemo(
    () =>
      selectedCourseTeeth.length > 0
        ? selectedCourseTeeth
        : chartProblemTeeth.map((i) => i.toothNumber),
    [selectedCourseTeeth, chartProblemTeeth]
  );

  function buildDiagnosis(teeth: string[]) {
    if (!teeth.length) return "";
    const teethText = teeth.map((t) => `${t}-tish`).join(", ");
    const diagnoses = [
      ...new Set(teeth.map((t) => toothMap[t]?.diagnoses?.[0]).filter(Boolean)),
    ];
    const diagText = diagnoses.map((d) => LABELS[d as ToothCondition] || d).join(", ");
    return `${teethText} ${diagText || "davolanishi"}`;
  }

  function handleToggleTooth(toothNumber: string) {
    setSelectedCourseTeeth((prev) => {
      const next = prev.includes(toothNumber)
        ? prev.filter((t) => t !== toothNumber)
        : [...prev, toothNumber].sort((a, b) => Number(a) - Number(b));
      setMainDiagnosis((cur) => (!cur.trim() ? buildDiagnosis(next) : cur));
      if (next.length > 0) setSelectedTooth(next[0]);
      return next;
    });
  }

  function updateSelectedTooth(next: Partial<ToothItem>) {
    setLocalToothMap((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
      return { ...base, [selectedTooth]: { ...(base[selectedTooth] || emptyTooth()), ...next } };
    });
  }

  function handleClearTooth() {
    setLocalToothMap((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
      const next = { ...base };
      delete next[selectedTooth];
      return next;
    });
  }

  async function handleSaveChart() {
    if (!Object.keys(toothMap).length) { toast.warning("Kamida bitta tish tanlang"); return; }
    const payload = { patientId, toothMap };
    if (chart && getId(chart)) await updateChart({ chartId: getId(chart), payload });
    else await createChart(payload);
    setLocalToothMap({});
    toast.success("Chart saqlandi");
  }

  async function handleCreateCourse() {
    if (!selectedCourseTeeth.length) { toast.warning("Davolanadigan tishlarni tanlang"); return; }
    const diagnosis = mainDiagnosis.trim() || buildDiagnosis(selectedCourseTeeth);
    if (!diagnosis) { toast.warning("Diagnosis kiriting"); return; }
    const created = await createCourse({ patientId, mainDiagnosis: diagnosis });
    setMainDiagnosis("");
    setSelectedCourseId(getId(created));
    setIsCreateCourseModalOpen(false);
    setActiveTab("COURSE");
    toast.success("Kurs yaratildi");
  }

  function handleAddProcedure(procedure: DentalProcedure) {
    const procedureId = getId(procedure);
    if (!procedureId) { toast.error("Procedure ID topilmadi"); return; }
    if (visitItems.some((i) => i.procedureId === procedureId && i.toothNumber === selectedTooth)) {
      toast.warning("Bu procedure allaqachon qo'shilgan"); return;
    }
    setVisitItems((prev) => [
      ...prev,
      {
        toothNumber: selectedTooth,
        procedureId,
        price: Number(procedure.defaultPrice || 0),
        completed: true,
        note: procedure.name,
      },
    ]);
    if (procedure.resultingCondition) {
      setLocalToothMap((prev) => {
        const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
        const cur = base[selectedTooth] || emptyTooth();
        return {
          ...base,
          [selectedTooth]: {
            ...cur,
            states: [procedure.resultingCondition as ToothCondition],
            note: cur.note || procedure.name,
          },
        };
      });
    }
  }

  async function handleAddVisit() {
    if (!selectedCourseId) { toast.warning("Treatment course tanlang"); return; }
    if (isSelectedCourseCompleted) { toast.warning("Bu kurs yakunlangan — visit qo'sha olmaysiz"); return; }
    if (!doctorId) { toast.warning("Doctor tanlang"); return; }
    if (!doctorNotes.trim()) { toast.warning("Shifokor izohi kiriting"); return; }
    if (!visitItems.length) { toast.warning("Kamida bitta muolaja tanlang"); return; }
    try {
      await addVisit({
        courseId: selectedCourseId,
        payload: {
          // appointmentId bo'lsa — mavjud appointmentga biriktiriladi.
          // Bo'lmasa — backend doctorId + joriy vaqt bilan avtomatik yaratadi.
          ...(appointmentId ? { appointmentId } : {}),
          visitDate,
          doctorId,
          doctorNotes: doctorNotes.trim(),
          items: visitItems,
        },
      });
      if (Object.keys(toothMap).length) {
        const payload = { patientId, toothMap };
        if (chart && getId(chart)) await updateChart({ chartId: getId(chart), payload });
        else await createChart(payload);
        setLocalToothMap({});
      }
      setDoctorNotes("");
      setVisitItems([]);
      setIsAddVisitModalOpen(false);
      setActiveTab("COURSE");
      toast.success(appointmentId ? "Visit saqlandi" : "Molaja boshlandi, appointment avtomatik yaratildi");
    } catch {
      toast.error("Visit saqlashda xatolik");
    }
  }

  async function handleCompleteCourse(courseId: string) {
    if (!window.confirm("Davolanish kursini yakunlaysizmi?")) return;
    await completeCourse(courseId);
    if (selectedCourseId === courseId) {
      setSelectedCourseId("");
      setVisitItems([]);
    }
    setCourseStatusFilter("COMPLETED");
    toast.success("Kurs yakunlandi");
  }

  function openAddVisitModal(courseId: string) {
    const course = courses.find((c) => getId(c) === courseId);
    if (course?.status === "COMPLETED") {
      toast.warning("Bu kurs yakunlangan — visit qo'sha olmaysiz");
      return;
    }
    setSelectedCourseId(courseId);
    setVisitItems([]);
    setDoctorNotes("");
    setVisitDate(nowLocalIso());
    // DOCTOR rolida bo'lsa — doctorId darhol o'ziniki bilan to'ldiriladi.
    setDoctorId(isDoctorUser && currentUserId ? currentUserId : "");
    setIsAddVisitModalOpen(true);
  }

  const visitPanelProps: VisitPanelProps = {
    activeCourses,
    selectedCourseId,
    onCourseChange: setSelectedCourseId,
    doctors,
    doctorId,
    onDoctorChange: setDoctorId,
    isDoctorLocked: isDoctorUser,
    lockedDoctorName: currentUserName,
    visitDate,
    onVisitDateChange: setVisitDate,
    doctorNotes,
    onDoctorNotesChange: setDoctorNotes,
    selectedTooth,
    onToothChange: setSelectedTooth,
    treatmentTeeth,
    visitItems,
    onRemoveItem: (idx) => setVisitItems((prev) => prev.filter((_, i) => i !== idx)),
    onSave: handleAddVisit,
    isSaving: isAddingVisit || isCreating || isUpdating,
    isCompleted: isSelectedCourseCompleted,
    isNewAppointment: !appointmentId,
    procedures,
    proceduresLoading,
    procedureSearch,
    onProcedureSearch: setProcedureSearch,
    onAddProcedure: handleAddProcedure,
    onGoToChart: () => setActiveTab("CHART"),
  };

  return (
    <div className="space-y-5">
      <PatientInfoCard patient={patient} isLoading={patientLoading} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-color bg-white p-3 shadow-sm">
        <TabBtn
          active={activeTab === "CHART"}
          icon={<Activity size={16} />}
          label="Dental Chart"
          onClick={() => setActiveTab("CHART")}
          badge={chartProblemTeeth.length || undefined}
        />
        <TabBtn
          active={activeTab === "COURSE"}
          icon={<ClipboardList size={16} />}
          label="Davolash kursi"
          onClick={() => setActiveTab("COURSE")}
          badge={activeCourses.length || undefined}
        />

        {activeTab === "CHART" && chartProblemTeeth.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const from = chartProblemTeeth.map((i) => i.toothNumber);
              if (!selectedCourseTeeth.length) {
                setSelectedCourseTeeth(from);
                if (from.length) setSelectedTooth(from[0]);
              }
              if (!mainDiagnosis.trim())
                setMainDiagnosis(buildDiagnosis(selectedCourseTeeth.length ? selectedCourseTeeth : from));
              setIsCreateCourseModalOpen(true);
            }}
            className="ml-auto rounded-xl bg-dark-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} className="mr-1.5 inline" />
            Kurs ochish
          </button>
        )}
      </div>

      {/* ====== CHART tab ====== */}
      {activeTab === "CHART" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {chartLoading ? (
              <div className="rounded-2xl border border-border-color bg-white">
                <DentalLoader fullScreen={false} text="Chart yuklanmoqda..." />
              </div>
            ) : (
              <>
                {chart?.toothMap && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-semibold text-blue-800">Avvalgi chart topildi</p>
                    <button
                      type="button"
                      onClick={() => setLocalToothMap(chart.toothMap!)}
                      className="rounded-lg bg-[#35a8f5] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Yuklash
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Chart holati", value: chart ? "Mavjud" : "Yangi", color: chart ? "text-emerald-600" : "text-[#35a8f5]" },
                    { label: "Belgilangan tishlar", value: chartProblemTeeth.length, color: "text-dark-navy" },
                    { label: "Tanlangan", value: `#${selectedTooth}`, color: "text-[#35a8f5]" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border-color bg-white p-4 shadow-sm">
                      <p className="text-xs text-text-light">{s.label}</p>
                      <p className={`mt-1 text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <Dental3DChart
                  selectedTooth={selectedTooth}
                  toothMap={toothMap}
                  onSelectTooth={(t) => {
                    setSelectedTooth(t);
                    setLocalToothMap((prev) => {
                      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
                      return { ...base, [t]: base[t] || emptyTooth() };
                    });
                  }}
                />
              </>
            )}
          </div>

          {/* Tooth editor */}
          <div className="h-fit rounded-2xl border border-border-color bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-dark-navy">Tish #{selectedTooth}</h2>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#35a8f5]/10 text-[#35a8f5]">
                <Edit3 size={18} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Diagnoz</label>
                <select
                  value={selectedToothData.diagnoses[0] || ""}
                  onChange={(e) =>
                    updateSelectedTooth({ diagnoses: e.target.value ? [e.target.value as ToothCondition] : [] })
                  }
                  className="w-full rounded-xl border border-border-color bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#35a8f5]"
                >
                  <option value="">Tanlang</option>
                  {DIAGNOSIS_OPTIONS.map((d) => <option key={d} value={d}>{LABELS[d]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Holat</label>
                <select
                  value={selectedToothData.states[0] || ""}
                  onChange={(e) =>
                    updateSelectedTooth({ states: e.target.value ? [e.target.value as ToothCondition] : [] })
                  }
                  className="w-full rounded-xl border border-border-color bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#35a8f5]"
                >
                  <option value="">Tanlang</option>
                  {STATE_OPTIONS.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Izoh</label>
                <textarea
                  value={selectedToothData.note}
                  onChange={(e) => updateSelectedTooth({ note: e.target.value })}
                  rows={4}
                  placeholder="Shifokor izohi..."
                  className="w-full resize-none rounded-xl border border-border-color bg-slate-50 p-3 text-sm outline-none focus:border-[#35a8f5]"
                />
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Diagnoz:</span>
                  <span className="font-semibold">
                    {selectedToothData.diagnoses[0] ? LABELS[selectedToothData.diagnoses[0] as ToothCondition] : "—"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-text-light">Holat:</span>
                  <span className="font-semibold">
                    {selectedToothData.states[0] ? LABELS[selectedToothData.states[0] as ToothCondition] : "—"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClearTooth}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border-color py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X size={16} /> Tozalash
                </button>
                <button
                  type="button"
                  onClick={handleSaveChart}
                  disabled={isCreating || isUpdating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#35a8f5] py-2.5 text-sm font-bold text-white transition hover:bg-[#1d8ee8] disabled:opacity-60"
                >
                  <Save size={16} /> {isCreating || isUpdating ? "..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== COURSE tab ====== */}
      {activeTab === "COURSE" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          {/* Course list */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-color bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-extrabold text-dark-navy">Davolash kurslari</h2>
                <div className="flex rounded-xl border border-border-color bg-slate-50 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCourseStatusFilter("ACTIVE")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      courseStatusFilter === "ACTIVE" ? "bg-[#35a8f5] text-white" : "text-slate-500"
                    }`}
                  >
                    Aktiv ({activeCourses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseStatusFilter("COMPLETED")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      courseStatusFilter === "COMPLETED" ? "bg-emerald-500 text-white" : "text-slate-500"
                    }`}
                  >
                    Tugallangan ({completedCourses.length})
                  </button>
                </div>
              </div>

              {coursesLoading ? (
                <DentalLoader fullScreen={false} text="Kurslar yuklanmoqda..." />
              ) : visibleCourses.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Kurs yo'q</p>
              ) : (
                <div className="space-y-3">
                  {visibleCourses.map((course) => {
                    const cId = getId(course);
                    const isSelected = selectedHistoryCourse ? getId(selectedHistoryCourse) === cId : false;
                    const isCompleted = course.status === "COMPLETED";

                    return (
                      <div
                        key={cId}
                        className={`rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-[#35a8f5] bg-blue-50"
                            : "border-border-color bg-white hover:border-[#35a8f5]/40"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCourseId(cId)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-dark-navy">{course.mainDiagnosis}</p>
                            <span className="text-xs text-slate-500">{course.visits?.length || 0} visit</span>
                          </div>
                          <p className="mt-1 text-sm font-bold text-[#35a8f5]">
                            {formatMoney(course.totalCoursePrice)}
                          </p>
                          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                            isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {isCompleted ? "Yakunlangan" : "Aktiv"}
                          </span>
                        </button>

                        {/* Actions — faqat active course uchun */}
                        {!isCompleted && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openAddVisitModal(cId)}
                              className="flex-1 rounded-lg bg-[#35a8f5] py-2 text-xs font-bold text-white hover:bg-[#1d8ee8]"
                            >
                              + Visit qo'shish
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCompleteCourse(cId)}
                              disabled={isCompleting}
                              className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                              ✓ Yakunlash
                            </button>
                          </div>
                        )}

                        {/* Completed badge */}
                        {isCompleted && (
                          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                            <Lock size={14} className="text-emerald-600" />
                            <p className="text-xs font-bold text-emerald-700">Kurs yakunlangan</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Visit history */}
          <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-dark-navy">Visit tarixi</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {selectedHistoryVisits.length} ta
              </span>
            </div>

            {!selectedHistoryCourse ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Kurs tanlang</p>
            ) : selectedHistoryVisits.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Bu kursda visit yo'q</p>
            ) : (
              <div className="relative space-y-4 pl-7">
                <div className="absolute bottom-4 left-[13px] top-4 w-px bg-slate-200" />
                {selectedHistoryVisits.map((visit: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-7 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white ring-4 ring-white ${
                      idx === 0 ? "bg-emerald-500" : "bg-[#35a8f5]"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="rounded-xl border border-border-color bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-dark-navy">Visit {idx + 1}</p>
                          <p className="text-xs text-text-light">{formatVisitDateTime(visit.visitDate)}</p>
                        </div>
                        <p className="text-sm font-bold text-[#35a8f5]">{formatMoney(getVisitTotal(visit))}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold">Shifokor:</span> {getVisitDoctorName(visit, doctorsMap)}
                      </p>
                      {visit.doctorNotes && (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {visit.doctorNotes}
                        </p>
                      )}
                      {visit.items?.length > 0 && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {visit.items.map((item: any, i: number) => (
                            <div key={i} className="rounded-lg bg-slate-50 p-2.5">
                              <p className="text-sm font-bold text-dark-navy">{item.toothNumber}-tish</p>
                              <p className="text-xs text-slate-500">
                                {item.note || item.procedureNameSnapshot}
                              </p>
                              <p className="text-xs font-bold text-[#35a8f5]">{formatMoney(getItemPrice(item))}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Create Course Modal ====== */}
      {isCreateCourseModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
                <div>
                  <h2 className="font-extrabold text-dark-navy">Davolash kursi ochish</h2>
                  <p className="mt-0.5 text-sm text-text-light">Davolanadigan tishlarni tanlang</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCourseModalOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold text-blue-900">
                      Davolanadigan tishlar ({selectedCourseTeeth.length} ta tanlandi)
                    </p>
                    <button
                      type="button"
                      onClick={() => setMainDiagnosis(buildDiagnosis(selectedCourseTeeth))}
                      disabled={!selectedCourseTeeth.length}
                      className="rounded-lg bg-[#35a8f5] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Auto to'ldirish
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {chartProblemTeeth.map((item) => {
                      const isActive = selectedCourseTeeth.includes(item.toothNumber);
                      return (
                        <button
                          key={item.toothNumber}
                          type="button"
                          onClick={() => handleToggleTooth(item.toothNumber)}
                          className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                            isActive
                              ? "bg-[#35a8f5] text-white"
                              : "bg-white text-slate-700 ring-1 ring-border-color hover:bg-blue-50"
                          }`}
                        >
                          <span className="block text-lg">#{item.toothNumber}</span>
                          <span className="block text-xs opacity-70">
                            {LABELS[item.diagnosis as ToothCondition] || item.diagnosis || "—"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Asosiy tashxis</label>
                  <textarea
                    value={mainDiagnosis}
                    onChange={(e) => setMainDiagnosis(e.target.value)}
                    placeholder="Masalan: 11 va 21-tish karies davolanishi"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border-color bg-slate-50 p-3 text-sm outline-none focus:border-[#35a8f5]"
                  />
                </div>

                <div className="flex gap-3 border-t border-border-color pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateCourseModalOpen(false)}
                    className="flex-1 rounded-xl border border-border-color py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    disabled={isCreatingCourse || !selectedCourseTeeth.length}
                    className="flex-1 rounded-xl bg-dark-navy py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isCreatingCourse ? "Yaratilmoqda..." : "Kurs yaratish"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ====== Add Visit Modal ====== */}
      {isAddVisitModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
            <div className="my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border-color bg-white px-6 py-4">
                <div>
                  <h2 className="font-extrabold text-dark-navy">Visit qo'shish</h2>
                  {selectedCourse && (
                    <p className="mt-0.5 text-sm text-text-light">
                      Kurs: <span className="font-semibold text-dark-navy">{selectedCourse.mainDiagnosis}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddVisitModalOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <VisitPanel {...visitPanelProps} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}