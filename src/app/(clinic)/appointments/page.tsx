"use client";

/**
 * File: src/app/(clinic)/appointments/page.tsx
 */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useCreateAppointment,
  useDeleteAppointment,
  useGetAppointments,
  useGetAppointmentsByDate,
  useUpdateAppointment,
} from "@/src/features/appointments/hooks/useAppointments";

import {
  useGetPatients,
  useSearchPatientByPhone,
} from "@/src/features/patients/hooks/usePatients";

import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { Role } from "@/src/lib/enums/enums.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import DentalLoader from "@/src/components/ui/DentalLoader";

import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

import { AppointmentStatus } from "@/src/lib/enums/enums.types";
import React from "react";

type ViewMode = "BY_DATE" | "ALL";

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];
const PAGE_SIZE = 10;

const STATUS_OPTIONS: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
];

const initialForm: CreateAppointmentDto = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  startTime: "09:00",
  slotDurationMinutes: 30,
  notes: "",
};

function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  let localNumber = digits;
  if (localNumber.startsWith("998")) localNumber = localNumber.slice(3);
  if (localNumber.startsWith("0")) localNumber = localNumber.slice(1);
  localNumber = localNumber.slice(0, 9);
  return localNumber ? `+998${localNumber}` : "+998";
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getItemId(item: any): string { return item?.id || item?._id || ""; }
function getAppointmentId(appointment: Appointment | null): string {
  if (!appointment) return "";
  return appointment.id || appointment._id || "";
}
function getPatientId(appointment: Appointment): string {
  return appointment.patientId || (appointment as any).patient?.id || (appointment as any).patient?._id || "";
}
function getDoctorId(appointment: Appointment): string {
  return appointment.doctorId || (appointment as any).doctor?.id || (appointment as any).doctor?._id || "";
}
function normalizeDateForInput(date?: string | Date | null): string {
  if (!date) return "";
  if (date instanceof Date) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const value = String(date).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  return value;
}
function normalizeTimeForInput(time?: string | null): string {
  if (!time) return "";
  const value = String(time).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  return value;
}
function formatTime(time?: string | null): string { return normalizeTimeForInput(time) || "-"; }
function timeToMinutes(time?: string | null): number {
  const normalized = normalizeTimeForInput(time);
  if (!normalized) return 99999;
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}
function getPersonName(person: any): string {
  if (!person) return "";
  if (person.fullName) return person.fullName;
  if (person.name) return person.name;
  return `${person.firstName || person.first_name || ""} ${person.lastName || person.last_name || ""}`.trim();
}
function getPersonPhone(person: any): string { return person?.phone || person?.phoneNumber || ""; }
function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function getStatusClass(status?: AppointmentStatus | string) {
  switch (status) {
    case AppointmentStatus.COMPLETED: return "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400 focus:ring-emerald-100";
    case AppointmentStatus.IN_PROGRESS: return "border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-400 focus:ring-amber-100";
    case AppointmentStatus.CANCELLED: return "border-red-200 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-100";
    default: return "border-sky-200 bg-sky-50 text-sky-700 focus:border-sky-400 focus:ring-sky-100";
  }
}
function getStatusDotClass(status?: AppointmentStatus | string) {
  switch (status) {
    case AppointmentStatus.COMPLETED: return "bg-emerald-500";
    case AppointmentStatus.IN_PROGRESS: return "bg-amber-500";
    case AppointmentStatus.CANCELLED: return "bg-red-500";
    default: return "bg-sky-500";
  }
}
function getStatusLabel(status?: AppointmentStatus | string) {
  switch (status) {
    case AppointmentStatus.COMPLETED: return "Completed";
    case AppointmentStatus.IN_PROGRESS: return "In progress";
    case AppointmentStatus.CANCELLED: return "Cancelled";
    default: return "Scheduled";
  }
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-xs font-extrabold text-white shadow-sm">
      {getInitials(name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
      if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(page);
      return acc;
    }, []);

  return (
    <div className="border-t border-slate-100 bg-white px-6 py-4">
      <p className="mb-3 text-center text-sm text-slate-500">
        <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)}</span>
        {" "}/{" "}
        <span className="font-bold text-slate-900">{total}</span> ta qabul
      </p>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5] disabled:opacity-30"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`dot-${idx}`} className="flex h-9 w-6 items-center justify-center text-sm text-slate-400">…</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page as number)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition ${
                currentPage === page
                  ? "border-[#35a8f5] bg-[#35a8f5] text-white shadow-sm shadow-blue-200"
                  : "border-slate-200 text-slate-500 hover:border-[#35a8f5] hover:text-[#35a8f5]"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5] disabled:opacity-30"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DoctorDropdown
// ---------------------------------------------------------------------------

function DoctorDropdown({ doctors, value, onChange }: { doctors: any[]; value: string; onChange: (id: string) => void; }) {
  const [open, setOpen] = React.useState(false);
  const selected = doctors.find((d) => getItemId(d) === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${selected ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300"}`}
      >
        {selected ? (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
              {getInitials(getPersonName(selected) || "D")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-blue-900">{getPersonName(selected)}</p>
              {selected.email && <p className="truncate text-xs text-slate-500">{selected.email}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="flex-1 text-sm font-bold text-slate-400">Doctor tanlang</span>
          </>
        )}
        <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[240px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            {selected && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-400 hover:bg-slate-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Tanlovni olib tashlash
              </button>
            )}
            {doctors.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">Doctor topilmadi</p>
            ) : (
              doctors.map((doctor: any, idx: number) => {
                const id = getItemId(doctor);
                const name = getPersonName(doctor) || "Unnamed doctor";
                const isActive = id === value;
                return (
                  <button key={id} type="button" onClick={() => { onChange(id); setOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${idx !== 0 ? "border-t border-slate-50" : ""} ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-black ${isActive ? "text-blue-900" : "text-slate-900"}`}>{name}</p>
                      {doctor.email && <p className="truncate text-xs text-slate-500">{doctor.email}</p>}
                    </div>
                    {isActive && (
                      <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppointmentModal
// ---------------------------------------------------------------------------

interface AppointmentModalProps {
  open: boolean;
  form: CreateAppointmentDto;
  selectedAppointment: Appointment | null;
  doctors: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (form: CreateAppointmentDto | ((prev: CreateAppointmentDto) => CreateAppointmentDto)) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function AppointmentModal({ open, form, selectedAppointment, doctors, isSubmitting, onClose, onChange, onSubmit }: AppointmentModalProps) {
  const [phoneSearch, setPhoneSearch] = useState("+998");
  const [searchStarted, setSearchStarted] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState("");

  const phoneDigits = phoneSearch.replace(/\D/g, "");
  const shouldSearch = searchStarted && phoneDigits.length === 12;

  const { data: foundPatients = [], isLoading: isPatientSearching } = useSearchPatientByPhone(shouldSearch ? phoneSearch : null);
  const foundPatient = foundPatients[0] || null;

  useEffect(() => {
    if (!open) { setPhoneSearch("+998"); setSearchStarted(false); setPatientSearchError(""); }
  }, [open]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!foundPatient) return;
    const patientId = getItemId(foundPatient);
    if (!patientId) return;
    onChangeRef.current({ ...formRef.current, patientId });
  }, [foundPatient]);

  function handleSearchPatient() {
    const digits = phoneSearch.replace(/\D/g, "");
    if (digits.length !== 12) { setPatientSearchError("To'liq raqam kiriting. Masalan: +998934919100"); return; }
    setSearchStarted(true);
    setPatientSearchError("");
  }

  function handlePhoneChange(value: string) {
    setPhoneSearch(formatPhoneNumber(value));
    setSearchStarted(false);
    setPatientSearchError("");
    if (!selectedAppointment) onChangeRef.current({ ...formRef.current, patientId: "" });
  }

  if (!open) return null;

  const selectedPatientName = (selectedAppointment as any)?.patientName || getPersonName((selectedAppointment as any)?.patient);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 backdrop-blur-md" />
      <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-7 text-white">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Calendar className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black">{selectedAppointment ? "Edit Appointment" : "Create Appointment"}</h2>
              <p className="mt-2 text-sm font-medium text-blue-50">Find patient by phone number, then choose doctor and time.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto px-6 py-7">
          {selectedAppointment ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-600">Patient</p>
              <p className="mt-1 text-sm font-black text-slate-900">{selectedPatientName || form.patientId}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">ID: {form.patientId}</p>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-900">Find Patient by Phone <span className="text-red-500">*</span></label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input type="tel" value={phoneSearch} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+998934919100" maxLength={13} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  <button type="button" onClick={handleSearchPatient} disabled={isPatientSearching || phoneDigits.length !== 12} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {isPatientSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </button>
                </div>
                {patientSearchError && <p className="mt-3 text-sm font-bold text-red-600">{patientSearchError}</p>}
                {searchStarted && !isPatientSearching && !foundPatient && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-black text-red-700">Patient topilmadi</p>
                    <p className="mt-1 text-xs font-semibold text-red-600">Avval patient create qiling, keyin appointment yarating.</p>
                  </div>
                )}
                {foundPatient && (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-600">Patient found</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{getPersonName(foundPatient)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">Phone: {getPersonPhone(foundPatient)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-900">Doctor <span className="text-red-500">*</span></label>
            <DoctorDropdown doctors={doctors} value={form.doctorId} onChange={(id) => onChange({ ...form, doctorId: id })} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-900">Date <span className="text-red-500">*</span></label>
              <input type="date" value={normalizeDateForInput(form.appointmentDate)} onChange={(e) => onChange({ ...form, appointmentDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-900">Start Time <span className="text-red-500">*</span></label>
              <input type="time" value={normalizeTimeForInput(form.startTime)} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-extrabold text-slate-900">Slot Duration <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
              {DURATION_OPTIONS.map((duration) => (
                <button key={duration} type="button" onClick={() => onChange({ ...form, slotDurationMinutes: duration })} className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${form.slotDurationMinutes === duration ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}>
                  {duration}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-900">Notes</label>
            <textarea value={form.notes || ""} onChange={(e) => onChange({ ...form, notes: e.target.value })} rows={4} placeholder="Appointment notes..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || (!selectedAppointment && !form.patientId)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedAppointment ? "Save Changes" : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppointmentsPage
// ---------------------------------------------------------------------------

export default function AppointmentsPage() {
  const toast = useToast();
  const searchParams = useSearchParams();

  const patientIdFromUrl = searchParams.get("patientId");
  const hasOpenedFromPatientRef = useRef(false);

  const page = 0;
  const limit = 1000; // hammani olib kelamiz, frontend da paginate qilamiz

  const [viewMode, setViewMode] = useState<ViewMode>("BY_DATE");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Pagination state — BY_DATE va ALL uchun alohida
  const [byDatePage, setByDatePage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateAppointmentDto>({ ...initialForm, appointmentDate: getTodayDate() });

  const { data: appointments = [], isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useGetAppointments(page, limit);
  const { data: appointmentsByDate = [], isLoading: isByDateLoading, isError: isByDateError, error: byDateError, refetch: refetchByDate } = useGetAppointmentsByDate(selectedDate);
  const { data: patients = [], isLoading: isPatientsLoading } = useGetPatients();
  const { data: allStaff = [], isLoading: isDoctorsLoading } = useGetDoctors();

  const doctors = allStaff.filter((staff: any) => staff.roles?.includes(Role.DOCTOR));

  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const isSubmitting = createAppointmentMutation.isPending || updateAppointmentMutation.isPending;

  const patientsMap = useMemo(() => {
    const map = new Map<string, any>();
    patients.forEach((p: any) => { const id = getItemId(p); if (id) map.set(id, p); });
    return map;
  }, [patients]);

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();
    doctors.forEach((d: any) => { const id = getItemId(d); if (id) map.set(id, d); });
    return map;
  }, [doctors]);

  useEffect(() => {
    if (!patientIdFromUrl || hasOpenedFromPatientRef.current) return;
    setSelectedAppointment(null);
    setForm({ ...initialForm, patientId: patientIdFromUrl, appointmentDate: selectedDate });
    setIsModalOpen(true);
    hasOpenedFromPatientRef.current = true;
  }, [patientIdFromUrl, selectedDate]);

  // Reset page when date or search changes
  useEffect(() => { setByDatePage(1); }, [selectedDate, search]);
  useEffect(() => { setAllPage(1); }, [search]);

  function enrichAppointments(list: Appointment[]) {
    return list.map((appointment) => {
      const patientFromApt = (appointment as any).patient;
      const doctorFromApt = (appointment as any).doctor;
      const patientId = appointment.patientId || patientFromApt?.id || patientFromApt?._id || "";
      const doctorId = appointment.doctorId || doctorFromApt?.id || doctorFromApt?._id || "";
      const patient = patientFromApt || patientsMap.get(patientId);
      const doctor = doctorFromApt || doctorsMap.get(doctorId);
      return {
        ...appointment,
        id: getAppointmentId(appointment),
        patientId, doctorId,
        appointmentDate: normalizeDateForInput(appointment.appointmentDate),
        patientName: getPersonName(patient) || "-",
        doctorName: getPersonName(doctor) || "Doctor not assigned",
        startTime: normalizeTimeForInput(appointment.startTime),
        endTime: normalizeTimeForInput((appointment as any).endTime),
        status: ((appointment as any).status as AppointmentStatus) || AppointmentStatus.SCHEDULED,
      };
    }).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }

  const enrichedAll = useMemo(() => enrichAppointments(appointments), [appointments, patientsMap, doctorsMap]);
  const enrichedByDate = useMemo(() => enrichAppointments(appointmentsByDate), [appointmentsByDate, patientsMap, doctorsMap]);

  const currentAppointments = viewMode === "BY_DATE" ? enrichedByDate : enrichedAll;
  const currentLoading = viewMode === "BY_DATE" ? isByDateLoading : isAllLoading;
  const currentError = viewMode === "BY_DATE" ? isByDateError : isAllError;
  const currentErrorObject = viewMode === "BY_DATE" ? byDateError : allError;
  const currentPage = viewMode === "BY_DATE" ? byDatePage : allPage;
  const setCurrentPage = viewMode === "BY_DATE" ? setByDatePage : setAllPage;

  const filteredAppointments = useMemo(() => {
    const value = search.trim().toLowerCase();
    const filtered = !value ? currentAppointments : currentAppointments.filter((a) =>
      [(a as any).patientName, (a as any).doctorName, a.appointmentDate, a.startTime, (a as any).endTime, a.notes, (a as any).status]
        .some((v) => String(v || "").toLowerCase().includes(value))
    );
    return [...filtered].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [currentAppointments, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => ({
    total: currentAppointments.length,
    scheduled: currentAppointments.filter((a) => ((a as any).status || AppointmentStatus.SCHEDULED) === AppointmentStatus.SCHEDULED).length,
    inProgress: currentAppointments.filter((a) => (a as any).status === AppointmentStatus.IN_PROGRESS).length,
    completed: currentAppointments.filter((a) => (a as any).status === AppointmentStatus.COMPLETED).length,
    cancelled: currentAppointments.filter((a) => (a as any).status === AppointmentStatus.CANCELLED).length,
  }), [currentAppointments]);

  function openCreateModal() {
    setSelectedAppointment(null);
    setForm({ ...initialForm, appointmentDate: selectedDate });
    setIsModalOpen(true);
  }

  function openEditModal(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setForm({
      patientId: getPatientId(appointment),
      doctorId: getDoctorId(appointment),
      appointmentDate: normalizeDateForInput(appointment.appointmentDate) || selectedDate,
      startTime: normalizeTimeForInput(appointment.startTime),
      slotDurationMinutes: Number(appointment.slotDurationMinutes || 30),
      notes: appointment.notes || "",
      status: (appointment.status as AppointmentStatus) || AppointmentStatus.SCHEDULED,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setSelectedAppointment(null);
    setForm({ ...initialForm, appointmentDate: selectedDate });
    setIsModalOpen(false);
  }

  function refreshCurrent() {
    if (viewMode === "BY_DATE") return refetchByDate();
    return refetchAll();
  }

  const handleFormChange = useCallback((updater: CreateAppointmentDto | ((prev: CreateAppointmentDto) => CreateAppointmentDto)) => {
    setForm((prev) => typeof updater === "function" ? updater(prev) : updater);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const startTime = normalizeTimeForInput(form.startTime);
    const appointmentDate = normalizeDateForInput(form.appointmentDate);
    if (!form.patientId) { toast.warning("Patientni telefon raqam orqali toping"); return; }
    if (!form.doctorId) { toast.warning("Doctor tanlang"); return; }
    if (!appointmentDate) { toast.warning("Appointment date kiriting"); return; }
    if (!startTime) { toast.warning("Start time kiriting"); return; }
    if (!form.slotDurationMinutes || form.slotDurationMinutes <= 0) { toast.warning("Slot duration noto'g'ri"); return; }
    try {
      if (selectedAppointment) {
        const appointmentId = getAppointmentId(selectedAppointment);
        if (!appointmentId) { toast.error("Appointment ID topilmadi"); return; }
        await updateAppointmentMutation.mutateAsync({
          appointmentId,
          payload: { patientId: form.patientId, doctorId: form.doctorId, appointmentDate, startTime, slotDurationMinutes: Number(form.slotDurationMinutes), notes: form.notes || "", status: selectedAppointment.status || AppointmentStatus.SCHEDULED },
        });
        toast.success("Appointment updated successfully");
      } else {
        await createAppointmentMutation.mutateAsync({
          patientId: form.patientId, doctorId: form.doctorId, appointmentDate, startTime,
          slotDurationMinutes: Number(form.slotDurationMinutes), notes: form.notes || "", status: AppointmentStatus.SCHEDULED,
        });
        toast.success("Appointment created successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Appointment saqlashda xatolik bo'ldi"));
    }
  }

  async function handleStatusChange(appointment: Appointment, status: AppointmentStatus) {
    const appointmentId = getAppointmentId(appointment);
    if (!appointmentId) { toast.error("Appointment ID topilmadi"); return; }
    const patientId = getPatientId(appointment);
    const doctorId = getDoctorId(appointment);
    const appointmentDate = normalizeDateForInput(appointment.appointmentDate);
    const startTime = normalizeTimeForInput(appointment.startTime);
    if (!patientId || !doctorId || !appointmentDate || !startTime) { toast.error("Ma'lumotlar to'liq emas"); return; }
    try {
      setChangingStatusId(appointmentId);
      await updateAppointmentMutation.mutateAsync({
        appointmentId,
        payload: { patientId, doctorId, appointmentDate, startTime, slotDurationMinutes: Number(appointment.slotDurationMinutes || 30), notes: appointment.notes || "", status },
      });
      toast.success(`Status changed to ${getStatusLabel(status)}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Status update qilishda xatolik"));
    } finally {
      setChangingStatusId(null);
    }
  }

  async function handleDelete(appointment: Appointment) {
    const appointmentId = getAppointmentId(appointment);
    if (!appointmentId) { toast.error("Appointment ID topilmadi"); return; }
    if (!confirm("Appointment o'chirilsinmi?")) return;
    try {
      await deleteAppointmentMutation.mutateAsync(appointmentId);
      toast.success("Appointment deleted successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Appointment delete qilishda xatolik bo'ldi"));
    }
  }

  const pageLoading = currentLoading || isPatientsLoading || isDoctorsLoading;

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/40 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-extrabold text-blue-50 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Dental CRM Appointments
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">Appointments</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-100">
                Manage patient appointments, visit time, doctor assignment and appointment status in one clean workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={refreshCurrent} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </button>
              <button type="button" onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-blue-950 shadow-xl shadow-blue-950/20 transition hover:bg-blue-50">
                <Plus className="h-4 w-4" /> Add Appointment
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total", value: stats.total },
              { label: "Scheduled", value: stats.scheduled },
              { label: "In Progress", value: stats.inProgress },
              { label: "Completed", value: stats.completed },
              { label: "Cancelled", value: stats.cancelled },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100">{stat.label}</p>
                <p className="mt-2 text-3xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Filters */}
        <section className="-mt-14 rounded-[2rem] border border-white bg-white/95 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setViewMode("BY_DATE")} className={`rounded-2xl px-5 py-3 text-sm font-black transition ${viewMode === "BY_DATE" ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                By Date
              </button>
              <button type="button" onClick={() => setViewMode("ALL")} className={`rounded-2xl px-5 py-3 text-sm font-black transition ${viewMode === "ALL" ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                All Appointments
              </button>
              {viewMode === "BY_DATE" && (
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              )}
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, doctor, date, time..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>
        </section>

        {/* List */}
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {viewMode === "BY_DATE" ? `Appointments on ${selectedDate}` : "All Appointments"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Sorted by time: 09:00, 09:30, 10:00...</p>
            </div>
            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
              {filteredAppointments.length} result{filteredAppointments.length === 1 ? "" : "s"}
            </span>
          </div>

          {pageLoading ? (
            <div className="rounded-[2rem] border border-white bg-white shadow-sm">
              <DentalLoader fullScreen={false} text="Loading appointments..." />
            </div>
          ) : currentError ? (
            <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl font-black text-red-600">!</div>
              <p className="text-lg font-black text-slate-900">Failed to load appointments</p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">{getApiErrorMessage(currentErrorObject, "Server error.")}</p>
              <button type="button" onClick={refreshCurrent} className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">Try Again</button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-[2rem] border border-white bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <Calendar className="h-8 w-8" />
              </div>
              <p className="text-lg font-black text-slate-900">No appointments found</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {viewMode === "BY_DATE" ? "No appointments for selected date." : "Create appointment for patient visit."}
              </p>
              <button type="button" onClick={openCreateModal} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Add Appointment
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">#</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Patient</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Doctor</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Date</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Time</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Notes</th>
                      <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedAppointments.map((appointment, index) => {
                      const appointmentId = getAppointmentId(appointment);
                      const currentStatus = ((appointment as any).status as AppointmentStatus) || AppointmentStatus.SCHEDULED;
                      const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;

                      return (
                        <tr key={appointmentId || index} className="transition hover:bg-slate-50/60">
                          <td className="px-5 py-4 align-middle text-sm font-bold text-slate-400">{globalIndex}</td>

                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <Avatar name={(appointment as any).patientName} />
                              <p className="max-w-[180px] truncate text-sm font-black text-slate-950">
                                {(appointment as any).patientName}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <span className="inline-flex max-w-[160px] items-center gap-1.5 truncate text-sm font-semibold text-slate-600">
                              <UserRound className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                              <span className="truncate">{(appointment as any).doctorName}</span>
                            </span>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                              {appointment.appointmentDate}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                              {formatTime(appointment.startTime)}
                              {(appointment as any).endTime ? ` - ${formatTime((appointment as any).endTime)}` : ""}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            {appointment.notes ? (
                              <p
                                title={appointment.notes}
                                className="max-w-[200px] truncate text-sm font-medium text-slate-500"
                              >
                                {appointment.notes}
                              </p>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <select
                              value={currentStatus}
                              disabled={changingStatusId === appointmentId}
                              onChange={(e) => handleStatusChange(appointment, e.target.value as AppointmentStatus)}
                              className={`w-full min-w-[140px] rounded-xl border px-3 py-2 text-xs font-black outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(currentStatus)}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{getStatusLabel(status)}</option>
                              ))}
                            </select>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(appointment)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(appointment)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filteredAppointments.length}
                pageSize={PAGE_SIZE}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </section>
      </main>

      <AppointmentModal
        open={isModalOpen}
        form={form}
        selectedAppointment={selectedAppointment}
        doctors={doctors}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}