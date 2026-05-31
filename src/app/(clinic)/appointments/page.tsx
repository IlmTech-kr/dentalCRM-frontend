"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
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

import { useGetPatients } from "@/src/features/patients/hooks/usePatients";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";

import { getApiErrorMessage } from "@/src/lib/api/http";
import { useToast } from "@/src/lib/hooks/Usetoast";

import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

type ViewMode = "BY_DATE" | "ALL";

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

const initialForm: CreateAppointmentDto = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  startTime: "09:00",
  slotDurationMinutes: 30,
  notes: "",
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getItemId(item: any): string {
  return item?.id || item?._id || "";
}

function getAppointmentId(appointment: Appointment | null): string {
  if (!appointment) return "";

  return appointment.id || appointment._id || "";
}

function normalizeDateForInput(date?: string | Date | null): string {
  if (!date) return "";

  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const value = String(date).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return value;
}

function normalizeTimeForInput(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function formatTime(time?: string | null): string {
  return normalizeTimeForInput(time) || "-";
}

function getPersonName(person: any): string {
  if (!person) return "";

  if (person.fullName) return person.fullName;
  if (person.name) return person.name;

  const firstName = person.firstName || person.first_name || "";
  const lastName = person.lastName || person.last_name || "";

  return `${firstName} ${lastName}`.trim();
}

function getInitials(name: string) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow-md">
      {getInitials(name)}
    </div>
  );
}

interface AppointmentModalProps {
  open: boolean;
  form: CreateAppointmentDto;
  selectedAppointment: Appointment | null;
  patients: any[];
  doctors: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (form: CreateAppointmentDto) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function AppointmentModal({
  open,
  form,
  selectedAppointment,
  patients,
  doctors,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: AppointmentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {selectedAppointment
                  ? "Edit Appointment"
                  : "Create Appointment"}
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-600">
                Select patient, doctor, date and appointment time.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 py-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Patient <span className="text-red-500">*</span>
              </label>

              <select
                value={form.patientId}
                onChange={(e) =>
                  onChange({
                    ...form,
                    patientId: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select patient</option>

                {patients.map((patient) => {
                  const id = getItemId(patient);
                  const name = getPersonName(patient) || id;

                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Doctor <span className="text-red-500">*</span>
              </label>

              <select
                value={form.doctorId}
                onChange={(e) =>
                  onChange({
                    ...form,
                    doctorId: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select doctor</option>

                {doctors.map((doctor) => {
                  const id = getItemId(doctor);
                  const name = getPersonName(doctor) || id;

                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Date <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={normalizeDateForInput(form.appointmentDate)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    appointmentDate: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Start Time <span className="text-red-500">*</span>
              </label>

              <input
                type="time"
                value={normalizeTimeForInput(form.startTime)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    startTime: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Slot Duration <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
              {DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...form,
                      slotDurationMinutes: duration,
                    })
                  }
                  className={`rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition ${
                    form.slotDurationMinutes === duration
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Notes
            </label>

            <textarea
              value={form.notes || ""}
              onChange={(e) =>
                onChange({
                  ...form,
                  notes: e.target.value,
                })
              }
              rows={4}
              placeholder="Appointment notes..."
              className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedAppointment ? "Save Changes" : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const toast = useToast();
  const searchParams = useSearchParams();

  const patientIdFromUrl = searchParams.get("patientId");
  const hasOpenedFromPatientRef = useRef(false);

  const [page] = useState(0);
  const [limit] = useState(10);

  const [viewMode, setViewMode] = useState<ViewMode>("BY_DATE");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [form, setForm] = useState<CreateAppointmentDto>({
    ...initialForm,
    appointmentDate: getTodayDate(),
  });

  const {
    data: appointments = [],
    isLoading: isAllLoading,
    isError: isAllError,
    error: allError,
    refetch: refetchAllAppointments,
  } = useGetAppointments(page, limit);

  const {
    data: appointmentsByDate = [],
    isLoading: isByDateLoading,
    isError: isByDateError,
    error: byDateError,
    refetch: refetchAppointmentsByDate,
  } = useGetAppointmentsByDate(selectedDate);

  const { data: patients = [], isLoading: isPatientsLoading } =
    useGetPatients();

  const { data: doctors = [], isLoading: isDoctorsLoading } = useGetDoctors();

  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const isSubmitting =
    createAppointmentMutation.isPending ||
    updateAppointmentMutation.isPending;

  const patientsMap = useMemo(() => {
    const map = new Map<string, any>();

    patients.forEach((patient: any) => {
      const id = getItemId(patient);

      if (id) {
        map.set(id, patient);
      }
    });

    return map;
  }, [patients]);

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();

    doctors.forEach((doctor: any) => {
      const id = getItemId(doctor);

      if (id) {
        map.set(id, doctor);
      }
    });

    return map;
  }, [doctors]);

  useEffect(() => {
    if (!patientIdFromUrl) return;
    if (hasOpenedFromPatientRef.current) return;

    setSelectedAppointment(null);

    setForm({
      ...initialForm,
      patientId: patientIdFromUrl,
      appointmentDate: selectedDate,
    });

    setIsModalOpen(true);
    hasOpenedFromPatientRef.current = true;
  }, [patientIdFromUrl, selectedDate]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const patientFromAppointment = (appointment as any).patient;
      const doctorFromAppointment = (appointment as any).doctor;

      const patient =
        patientFromAppointment || patientsMap.get(appointment.patientId);

      const doctor =
        doctorFromAppointment || doctorsMap.get(appointment.doctorId);

      return {
        ...appointment,
        id: getAppointmentId(appointment),
        appointmentDate: normalizeDateForInput(appointment.appointmentDate),
        patientName: getPersonName(patient) || appointment.patientId || "-",
        doctorName: getPersonName(doctor) || appointment.doctorId || "-",
        startTime: normalizeTimeForInput(appointment.startTime),
        endTime: normalizeTimeForInput((appointment as any).endTime),
      };
    });
  }, [appointments, patientsMap, doctorsMap]);

  const enrichedAppointmentsByDate = useMemo(() => {
    return appointmentsByDate
      .map((appointment) => {
        const patientFromAppointment = (appointment as any).patient;
        const doctorFromAppointment = (appointment as any).doctor;

        const patient =
          patientFromAppointment || patientsMap.get(appointment.patientId);

        const doctor =
          doctorFromAppointment || doctorsMap.get(appointment.doctorId);

        return {
          ...appointment,
          id: getAppointmentId(appointment),
          appointmentDate: normalizeDateForInput(appointment.appointmentDate),
          patientName: getPersonName(patient) || appointment.patientId || "-",
          doctorName: getPersonName(doctor) || appointment.doctorId || "-",
          startTime: normalizeTimeForInput(appointment.startTime),
          endTime: normalizeTimeForInput((appointment as any).endTime),
        };
      })
      .sort((a, b) =>
        String(a.startTime || "").localeCompare(String(b.startTime || ""))
      );
  }, [appointmentsByDate, patientsMap, doctorsMap]);

  const currentAppointments =
    viewMode === "BY_DATE" ? enrichedAppointmentsByDate : enrichedAppointments;

  const currentLoading = viewMode === "BY_DATE" ? isByDateLoading : isAllLoading;
  const currentError = viewMode === "BY_DATE" ? isByDateError : isAllError;
  const currentErrorObject = viewMode === "BY_DATE" ? byDateError : allError;

  const filteredAppointments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return currentAppointments;

    return currentAppointments.filter((appointment) => {
      return (
        String((appointment as any).patientName || "")
          .toLowerCase()
          .includes(value) ||
        String((appointment as any).doctorName || "")
          .toLowerCase()
          .includes(value) ||
        String(appointment.appointmentDate || "")
          .toLowerCase()
          .includes(value) ||
        String(appointment.startTime || "").toLowerCase().includes(value) ||
        String((appointment as any).endTime || "")
          .toLowerCase()
          .includes(value) ||
        String(appointment.notes || "").toLowerCase().includes(value) ||
        String(appointment.status || "").toLowerCase().includes(value)
      );
    });
  }, [currentAppointments, search]);

  function openCreateModal() {
    setSelectedAppointment(null);

    setForm({
      ...initialForm,
      appointmentDate: selectedDate,
    });

    setIsModalOpen(true);
  }

  function openEditModal(appointment: Appointment) {
    setSelectedAppointment(appointment);

    setForm({
      patientId: appointment.patientId || "",
      doctorId: appointment.doctorId || "",
      appointmentDate:
        normalizeDateForInput(appointment.appointmentDate) || selectedDate,
      startTime: normalizeTimeForInput(appointment.startTime),
      slotDurationMinutes: Number(appointment.slotDurationMinutes || 30),
      notes: appointment.notes || "",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setSelectedAppointment(null);

    setForm({
      ...initialForm,
      appointmentDate: selectedDate,
    });

    setIsModalOpen(false);
  }

  async function refreshCurrent() {
    if (viewMode === "BY_DATE") {
      await refetchAppointmentsByDate();
      return;
    }

    await refetchAllAppointments();
  }

  async function refreshAll() {
    await Promise.all([refetchAllAppointments(), refetchAppointmentsByDate()]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const startTime = normalizeTimeForInput(form.startTime);
    const appointmentDate = normalizeDateForInput(form.appointmentDate);

    if (!form.patientId) {
      toast.warning("Patient tanlang");
      return;
    }

    if (!form.doctorId) {
      toast.warning("Doctor tanlang");
      return;
    }

    if (!appointmentDate) {
      toast.warning("Appointment date kiriting");
      return;
    }

    if (!startTime) {
      toast.warning("Start time kiriting");
      return;
    }

    if (!form.slotDurationMinutes || form.slotDurationMinutes <= 0) {
      toast.warning("Slot duration noto'g'ri");
      return;
    }

    try {
      if (selectedAppointment) {
        const appointmentId = getAppointmentId(selectedAppointment);

        if (!appointmentId) {
          toast.error("Appointment ID topilmadi");
          return;
        }

        const payload: UpdateAppointmentDto = {
          patientId: form.patientId,
          doctorId: form.doctorId,
          appointmentDate,
          startTime,
          slotDurationMinutes: Number(form.slotDurationMinutes),
          notes: form.notes || "",
        };

        await updateAppointmentMutation.mutateAsync({
          appointmentId,
          payload,
        });

        toast.success("Appointment updated successfully");
      } else {
        const payload: CreateAppointmentDto = {
          patientId: form.patientId,
          doctorId: form.doctorId,
          appointmentDate,
          startTime,
          slotDurationMinutes: Number(form.slotDurationMinutes),
          notes: form.notes || "",
        };

        await createAppointmentMutation.mutateAsync(payload);

        toast.success("Appointment created successfully");
      }

      closeModal();
      await refreshAll();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Appointment saqlashda xatolik bo'ldi")
      );
    }
  }

  async function handleDelete(appointment: Appointment) {
    const appointmentId = getAppointmentId(appointment);

    if (!appointmentId) {
      toast.error("Appointment ID topilmadi");
      return;
    }

    const confirmed = confirm("Appointment o'chirilsinmi?");

    if (!confirmed) return;

    try {
      await deleteAppointmentMutation.mutateAsync(appointmentId);

      toast.success("Appointment deleted successfully");
      await refreshAll();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Appointment delete qilishda xatolik bo'ldi")
      );
    }
  }

  const pageLoading = currentLoading || isPatientsLoading || isDoctorsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Calendar className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  Appointments
                </h1>

                <p className="mt-1 text-sm font-medium text-slate-600">
                  Manage patient appointments, doctors, dates and visit times.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={refreshCurrent}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setViewMode("BY_DATE")}
                className={`rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
                  viewMode === "BY_DATE"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                By Date
              </button>

              <button
                type="button"
                onClick={() => setViewMode("ALL")}
                className={`rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
                  viewMode === "ALL"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Appointments
              </button>

              {viewMode === "BY_DATE" && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, doctor, date, time..."
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {viewMode === "BY_DATE"
                    ? `Appointments on ${selectedDate}`
                    : "All Appointments"}
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {viewMode === "BY_DATE"
                    ? "Showing appointments from by-date API."
                    : "Showing paginated appointments from all appointments API."}
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700">
                {filteredAppointments.length} result
                {filteredAppointments.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {pageLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading appointments...
            </div>
          ) : currentError ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">
                !
              </div>

              <p className="text-lg font-extrabold text-slate-900">
                Failed to load appointments
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                {getApiErrorMessage(
                  currentErrorObject,
                  "Server error. Appointments API ichida xato bor."
                )}
              </p>

              <button
                type="button"
                onClick={refreshCurrent}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <Calendar className="h-8 w-8" />
              </div>

              <p className="text-lg font-extrabold text-slate-900">
                No appointments found
              </p>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {viewMode === "BY_DATE"
                  ? "No appointments for selected date."
                  : "Create appointment for patient visit."}
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Appointment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Doctor
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Time
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Duration
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const appointmentId = getAppointmentId(appointment);

                    return (
                      <tr
                        key={appointmentId}
                        className="border-t border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={(appointment as any).patientName} />

                            <div>
                              <p className="font-extrabold text-slate-900">
                                {(appointment as any).patientName}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <UserRound className="h-3.5 w-3.5" />
                                {appointment.patientId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-extrabold text-slate-900">
                            {(appointment as any).doctorName}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {appointment.doctorId}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700">
                            {normalizeDateForInput(appointment.appointmentDate)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800">
                            <Clock className="h-4 w-4 text-blue-600" />
                            {formatTime(appointment.startTime)} -{" "}
                            {formatTime((appointment as any).endTime)}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700">
                            {appointment.slotDurationMinutes || "-"} min
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
                            {appointment.status || "SCHEDULED"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(appointment)}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(appointment)}
                              disabled={deleteAppointmentMutation.isPending}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <AppointmentModal
        open={isModalOpen}
        form={form}
        selectedAppointment={selectedAppointment}
        patients={patients}
        doctors={doctors}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onChange={setForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}