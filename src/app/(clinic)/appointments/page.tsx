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
  AppointmentStatus,
} from "@/src/types/appointment.types";

type ViewMode = "BY_DATE" | "ALL";

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

const STATUS_OPTIONS: AppointmentStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

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

function getPatientId(appointment: Appointment): string {
  return (
    appointment.patientId ||
    (appointment as any).patient?.id ||
    (appointment as any).patient?._id ||
    ""
  );
}

function getDoctorId(appointment: Appointment): string {
  return (
    appointment.doctorId ||
    (appointment as any).doctor?.id ||
    (appointment as any).doctor?._id ||
    ""
  );
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

function getStatusClass(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400 focus:ring-emerald-100";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-400 focus:ring-amber-100";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700 focus:border-sky-400 focus:ring-sky-100";
  }
}

function getStatusDotClass(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "IN_PROGRESS":
      return "bg-amber-500";
    default:
      return "bg-sky-500";
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In progress";
    default:
      return "Scheduled";
  }
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-lg shadow-blue-200">
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
        className="absolute inset-0 backdrop-blur-md"
      />

      <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-7 text-white">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Calendar className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-black">
                {selectedAppointment
                  ? "Edit Appointment"
                  : "Create Appointment"}
              </h2>

              <p className="mt-2 text-sm font-medium text-blue-50">
                Patient, doctor, date and time information.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto px-6 py-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-900">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
              <label className="mb-2 block text-sm font-extrabold text-slate-900">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select doctor</option>

                {doctors.map((doctor) => {
                  const id = getItemId(doctor);
                  const name = getPersonName(doctor) || "Unnamed doctor";

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
              <label className="mb-2 block text-sm font-extrabold text-slate-900">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-900">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-extrabold text-slate-900">
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
                  className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
                    form.slotDurationMinutes === duration
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-900">
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
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

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
    return appointments
      .map((appointment) => {
        const patientFromAppointment = (appointment as any).patient;
        const doctorFromAppointment = (appointment as any).doctor;

        const patientId =
          appointment.patientId ||
          patientFromAppointment?.id ||
          patientFromAppointment?._id ||
          "";

        const doctorId =
          appointment.doctorId ||
          doctorFromAppointment?.id ||
          doctorFromAppointment?._id ||
          "";

        const patient = patientFromAppointment || patientsMap.get(patientId);
        const doctor = doctorFromAppointment || doctorsMap.get(doctorId);

        return {
          ...appointment,
          id: getAppointmentId(appointment),
          patientId,
          doctorId,
          appointmentDate: normalizeDateForInput(appointment.appointmentDate),
          patientName: getPersonName(patient) || "-",
          doctorName: getPersonName(doctor) || "Doctor not assigned",
          startTime: normalizeTimeForInput(appointment.startTime),
          endTime: normalizeTimeForInput((appointment as any).endTime),
          status: (appointment as any).status || "SCHEDULED",
        };
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [appointments, patientsMap, doctorsMap]);

  const enrichedAppointmentsByDate = useMemo(() => {
    return appointmentsByDate
      .map((appointment) => {
        const patientFromAppointment = (appointment as any).patient;
        const doctorFromAppointment = (appointment as any).doctor;

        const patientId =
          appointment.patientId ||
          patientFromAppointment?.id ||
          patientFromAppointment?._id ||
          "";

        const doctorId =
          appointment.doctorId ||
          doctorFromAppointment?.id ||
          doctorFromAppointment?._id ||
          "";

        const patient = patientFromAppointment || patientsMap.get(patientId);
        const doctor = doctorFromAppointment || doctorsMap.get(doctorId);

        return {
          ...appointment,
          id: getAppointmentId(appointment),
          patientId,
          doctorId,
          appointmentDate: normalizeDateForInput(appointment.appointmentDate),
          patientName: getPersonName(patient) || "-",
          doctorName: getPersonName(doctor) || "Doctor not assigned",
          startTime: normalizeTimeForInput(appointment.startTime),
          endTime: normalizeTimeForInput((appointment as any).endTime),
          status: (appointment as any).status || "SCHEDULED",
        };
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [appointmentsByDate, patientsMap, doctorsMap]);

  const currentAppointments =
    viewMode === "BY_DATE" ? enrichedAppointmentsByDate : enrichedAppointments;

  const currentLoading = viewMode === "BY_DATE" ? isByDateLoading : isAllLoading;
  const currentError = viewMode === "BY_DATE" ? isByDateError : isAllError;
  const currentErrorObject = viewMode === "BY_DATE" ? byDateError : allError;

  const filteredAppointments = useMemo(() => {
    const value = search.trim().toLowerCase();

    const filtered = !value
      ? currentAppointments
      : currentAppointments.filter((appointment) => {
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
            String((appointment as any).status || "")
              .toLowerCase()
              .includes(value)
          );
        });

    return [...filtered].sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  }, [currentAppointments, search]);

  const stats = useMemo(() => {
    const total = currentAppointments.length;

    const scheduled = currentAppointments.filter(
      (item) => ((item as any).status || "SCHEDULED") === "SCHEDULED"
    ).length;

    const inProgress = currentAppointments.filter(
      (item) => (item as any).status === "IN_PROGRESS"
    ).length;

    const completed = currentAppointments.filter(
      (item) => (item as any).status === "COMPLETED"
    ).length;

    return {
      total,
      scheduled,
      inProgress,
      completed,
    };
  }, [currentAppointments]);

  function openCreateModal() {
    setSelectedAppointment(null);

    setForm({
      ...initialForm,
      appointmentDate: selectedDate,
    });

    setIsModalOpen(true);
  }

  function openEditModal(appointment: Appointment) {
    const patientId = getPatientId(appointment);
    const doctorId = getDoctorId(appointment);

    setSelectedAppointment(appointment);

    setForm({
      patientId,
      doctorId,
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
          status: selectedAppointment.status || "SCHEDULED",
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

  async function handleStatusChange(
    appointment: Appointment,
    status: AppointmentStatus
  ) {
    const appointmentId = getAppointmentId(appointment);

    if (!appointmentId) {
      toast.error("Appointment ID topilmadi");
      return;
    }

    const patientId = getPatientId(appointment);
    const doctorId = getDoctorId(appointment);

    const appointmentDate = normalizeDateForInput(appointment.appointmentDate);
    const startTime = normalizeTimeForInput(appointment.startTime);

    if (!patientId) {
      toast.error("Patient topilmadi");
      return;
    }

    if (!doctorId) {
      toast.error("Doctor topilmadi");
      return;
    }

    if (!appointmentDate || !startTime) {
      toast.error("Appointment date yoki start time topilmadi");
      return;
    }

    try {
      setChangingStatusId(appointmentId);

      const payload: UpdateAppointmentDto = {
        patientId,
        doctorId,
        appointmentDate,
        startTime,
        slotDurationMinutes: Number(appointment.slotDurationMinutes || 30),
        notes: appointment.notes || "",
        status,
      };

      await updateAppointmentMutation.mutateAsync({
        appointmentId,
        payload,
      });

      toast.success(`Status changed to ${status}`);
      await refreshAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Status update qilishda xatolik"));
    } finally {
      setChangingStatusId(null);
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
    <div className="min-h-screen bg-[#F6F8FC]">
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

              <h1 className="text-4xl font-black tracking-tight text-white">
                Appointments
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-100">
                Manage patient appointments, visit time, doctor assignment and
                appointment status in one clean workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshCurrent}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-blue-950 shadow-xl shadow-blue-950/20 transition hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                Add Appointment
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Total
              </p>
              <p className="mt-2 text-3xl font-black">{stats.total}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Scheduled
              </p>
              <p className="mt-2 text-3xl font-black">{stats.scheduled}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                In Progress
              </p>
              <p className="mt-2 text-3xl font-black">{stats.inProgress}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Completed
              </p>
              <p className="mt-2 text-3xl font-black">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="-mt-14 rounded-[2rem] border border-white bg-white/95 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setViewMode("BY_DATE")}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                  viewMode === "BY_DATE"
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                By Date
              </button>

              <button
                type="button"
                onClick={() => setViewMode("ALL")}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                  viewMode === "ALL"
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              )}
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, doctor, date, time..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {viewMode === "BY_DATE"
                  ? `Appointments on ${selectedDate}`
                  : "All Appointments"}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Sorted by time: 09:00, 09:30, 10:00...
              </p>
            </div>

            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
              {filteredAppointments.length} result
              {filteredAppointments.length === 1 ? "" : "s"}
            </span>
          </div>

          {pageLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-white bg-white px-6 py-24 text-sm font-bold text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading appointments...
            </div>
          ) : currentError ? (
            <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl font-black text-red-600">
                !
              </div>

              <p className="text-lg font-black text-slate-900">
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
                className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-[2rem] border border-white bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <Calendar className="h-8 w-8" />
              </div>

              <p className="text-lg font-black text-slate-900">
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
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Appointment
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredAppointments.map((appointment, index) => {
                const appointmentId = getAppointmentId(appointment);

                const currentStatus =
                  ((appointment as any).status as AppointmentStatus) ||
                  "SCHEDULED";

                return (
                  <article
                    key={appointmentId || index}
                    className="group overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr_auto]">
                      <div className="flex gap-4 p-5 sm:p-6">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg shadow-slate-300">
                            {index + 1}
                          </div>

                          <div className="mt-3 h-full w-px bg-slate-100" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Avatar name={(appointment as any).patientName} />

                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                currentStatus
                              )}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${getStatusDotClass(
                                  currentStatus
                                )}`}
                              />
                              {getStatusLabel(currentStatus)}
                            </span>
                          </div>

                          <h3 className="mt-3 truncate text-xl font-black text-slate-950">
                            {(appointment as any).patientName}
                          </h3>

                          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                            <UserRound className="h-4 w-4 text-slate-400" />
                            Patient appointment
                          </p>

                          {appointment.notes && (
                            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 border-y border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-3 lg:grid-cols-1 lg:border-x lg:border-y-0 lg:p-6">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Doctor
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-slate-900">
                            {(appointment as any).doctorName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Date
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900">
                            {normalizeDateForInput(appointment.appointmentDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Time
                          </p>
                          <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900">
                            <Clock className="h-4 w-4 text-blue-600" />
                            {formatTime(appointment.startTime)} -{" "}
                            {formatTime((appointment as any).endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center lg:w-72 lg:flex-col lg:items-stretch lg:p-6">
                        <div>
                          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                            Change Status
                          </p>

                          <select
                            value={currentStatus}
                            disabled={changingStatusId === appointmentId}
                            onChange={(e) =>
                              handleStatusChange(
                                appointment,
                                e.target.value as AppointmentStatus
                              )
                            }
                            className={`w-full rounded-2xl border px-4 py-3 text-xs font-black outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(
                              currentStatus
                            )}`}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <span className="mr-auto rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 lg:mr-0">
                            {appointment.slotDurationMinutes || "-"} min
                          </span>

                          <button
                            type="button"
                            aria-label="Edit appointment"
                            title="Edit"
                            onClick={() => openEditModal(appointment)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            aria-label="Delete appointment"
                            title="Delete"
                            onClick={() => handleDelete(appointment)}
                            disabled={deleteAppointmentMutation.isPending}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
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