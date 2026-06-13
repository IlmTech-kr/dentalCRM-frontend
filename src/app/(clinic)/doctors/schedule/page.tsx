"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useCreateDoctorSchedule,
  useCreateWeeklyDoctorSchedule,
  useGetDoctorSchedules,
  useUpdateDoctorSchedule,
} from "@/src/features/doctors/hooks/useDoctorSchedules";

import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";

import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  WeeklyDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

import { DayOfWeek } from "@/src/lib/enums/enums.types";

import { getApiErrorMessage } from "@/src/lib/api/http";
import { useToast } from "@/src/lib/hooks/Usetoast";

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: DayOfWeek.MONDAY, label: "Monday", short: "Mon" },
  { value: DayOfWeek.TUESDAY, label: "Tuesday", short: "Tue" },
  { value: DayOfWeek.WEDNESDAY, label: "Wednesday", short: "Wed" },
  { value: DayOfWeek.THURSDAY, label: "Thursday", short: "Thu" },
  { value: DayOfWeek.FRIDAY, label: "Friday", short: "Fri" },
  { value: DayOfWeek.SATURDAY, label: "Saturday", short: "Sat" },
  { value: DayOfWeek.SUNDAY, label: "Sunday", short: "Sun" },
];

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

type ScheduleForm = DoctorSchedulePayload & {
  slotDurationMinutes?: number;
};

type FlatDoctorSchedule = DoctorSchedule & {
  doctorName?: string;
  scheduleParentId?: string;
};

const initialForm: ScheduleForm = {
  doctorId: "",
  dayOfWeek: DayOfWeek.MONDAY,
  startTime: "09:00",
  endTime: "18:00",
  slotDurationMinutes: 30,
  active: true,
};

function normalizeScheduleTime(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function getScheduleId(schedule: DoctorSchedule | null) {
  if (!schedule) return "";

  return schedule._id || schedule.id || "";
}

function getDoctorId(doctor: any) {
  return doctor?.id || doctor?._id || "";
}

function getDoctorName(doctor: any) {
  if (!doctor) return "";

  if (doctor.fullName) return doctor.fullName;
  if (doctor.name) return doctor.name;

  return `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
}

function getDoctorInitials(name: string) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDayLabel(day?: DayOfWeek | string) {
  return DAYS.find((item) => item.value === day)?.label || day || "-";
}

function getDayShort(day?: DayOfWeek | string) {
  return DAYS.find((item) => item.value === day)?.short || day || "-";
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow-md">
      {getDoctorInitials(name)}
    </div>
  );
}

interface ScheduleModalProps {
  open: boolean;
  form: ScheduleForm;
  doctors: any[];
  selectedSchedule: DoctorSchedule | null;
  isSubmitting: boolean;
  createForWholeWeek: boolean;
  onCreateForWholeWeekChange: (value: boolean) => void;
  onClose: () => void;
  onChange: (form: ScheduleForm) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function ScheduleModal({
  open,
  form,
  doctors,
  selectedSchedule,
  isSubmitting,
  createForWholeWeek,
  onCreateForWholeWeekChange,
  onClose,
  onChange,
  onSubmit,
}: ScheduleModalProps) {
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
                {selectedSchedule ? "Edit Doctor Schedule" : "Create Schedule"}
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-600">
                {createForWholeWeek && !selectedSchedule
                  ? "Create same working time for all days of the week."
                  : "Set doctor working day, start time and end time."}
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

        <form onSubmit={onSubmit} className="space-y-7 px-6 py-7">
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Doctor <span className="text-red-500">*</span>
            </label>

            <select
              value={form.doctorId}
              disabled={Boolean(selectedSchedule)}
              onChange={(e) =>
                onChange({
                  ...form,
                  doctorId: e.target.value,
                })
              }
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Select doctor</option>

              {doctors.map((doctor) => {
                const id = getDoctorId(doctor);
                const name = getDoctorName(doctor);

                return (
                  <option key={id} value={id}>
                    {name || id}
                  </option>
                );
              })}
            </select>
          </div>

          {!selectedSchedule && (
            <div className="flex items-center justify-between rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Create for whole week
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  This will create the same schedule for all days.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onCreateForWholeWeekChange(!createForWholeWeek)
                }
                className={`relative h-8 w-14 rounded-full transition ${
                  createForWholeWeek ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    createForWholeWeek ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          )}

          {!createForWholeWeek && (
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Working Day <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...form,
                        dayOfWeek: day.value,
                      })
                    }
                    className={`rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${
                      form.dayOfWeek === day.value
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Start Time <span className="text-red-500">*</span>
              </label>

              <input
                type="time"
                value={normalizeScheduleTime(form.startTime)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    startTime: normalizeScheduleTime(e.target.value),
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                End Time <span className="text-red-500">*</span>
              </label>

              <input
                type="time"
                value={normalizeScheduleTime(form.endTime)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    endTime: normalizeScheduleTime(e.target.value),
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {!createForWholeWeek && (
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Slot Duration
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
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    {duration}m
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4">
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Schedule Active
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                If inactive, this schedule will not be used for appointments.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...form,
                  active: !form.active,
                })
              }
              className={`relative h-8 w-14 rounded-full transition ${
                form.active ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                  form.active ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {selectedSchedule
                ? "Save Changes"
                : createForWholeWeek
                  ? "Create Weekly Schedule"
                  : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DoctorSchedulePage() {
  const toast = useToast();

  const [page] = useState(0);
  const [limit] = useState(20);

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<DoctorSchedule | null>(null);

  const [form, setForm] = useState<ScheduleForm>(initialForm);
  const [createForWholeWeek, setCreateForWholeWeek] = useState(false);

  const selectedScheduleId = getScheduleId(selectedSchedule);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDoctorSchedules(page, limit);

  const { data: doctors = [], isLoading: isDoctorsLoading } = useGetDoctors();

  const createScheduleMutation = useCreateDoctorSchedule();
  const createWeeklyScheduleMutation = useCreateWeeklyDoctorSchedule();
  const updateScheduleMutation = useUpdateDoctorSchedule(selectedScheduleId);

  const isSubmitting =
    createScheduleMutation.isPending ||
    createWeeklyScheduleMutation.isPending ||
    updateScheduleMutation.isPending;

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();

    doctors.forEach((doctor: any) => {
      const id = getDoctorId(doctor);

      if (id) {
        map.set(id, doctor);
      }
    });

    return map;
  }, [doctors]);

  const flatSchedules = useMemo<FlatDoctorSchedule[]>(() => {
    return schedules.flatMap((schedule) => {
      if (Array.isArray(schedule.days) && schedule.days.length > 0) {
        return schedule.days.map((day) => ({
          ...schedule,
          id: `${getScheduleId(schedule)}-${day.dayOfWeek}`,
          scheduleParentId: getScheduleId(schedule),
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          active: day.active,
        }));
      }

      return [schedule];
    });
  }, [schedules]);

  const enrichedSchedules = useMemo(() => {
    return flatSchedules.map((schedule) => {
      const doctorFromSchedule = (schedule as any).doctor;
      const doctorFromList = doctorsMap.get(schedule.doctorId);
      const doctor = doctorFromSchedule || doctorFromList;

      return {
        ...schedule,
        doctorName: getDoctorName(doctor) || schedule.doctorId || "-",
        startTime: normalizeScheduleTime(schedule.startTime),
        endTime: normalizeScheduleTime(schedule.endTime),
      };
    });
  }, [flatSchedules, doctorsMap]);

  const filteredSchedules = useMemo(() => {
    const value = search.trim().toLowerCase();

    return enrichedSchedules
      .filter((schedule) => {
        if (selectedDay !== "ALL" && schedule.dayOfWeek !== selectedDay) {
          return false;
        }

        if (!value) return true;

        return (
          String((schedule as any).doctorName || "")
            .toLowerCase()
            .includes(value) ||
          String(schedule.dayOfWeek || "").toLowerCase().includes(value) ||
          normalizeScheduleTime(schedule.startTime).includes(value) ||
          normalizeScheduleTime(schedule.endTime).includes(value)
        );
      })
      .sort((a, b) => {
        const dayA = DAYS.findIndex((day) => day.value === a.dayOfWeek);
        const dayB = DAYS.findIndex((day) => day.value === b.dayOfWeek);

        if (dayA !== dayB) return dayA - dayB;

        return normalizeScheduleTime(a.startTime).localeCompare(
          normalizeScheduleTime(b.startTime),
        );
      });
  }, [enrichedSchedules, selectedDay, search]);

  function openCreateModal() {
    setSelectedSchedule(null);
    setCreateForWholeWeek(false);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(schedule: DoctorSchedule) {
    setSelectedSchedule(schedule);
    setCreateForWholeWeek(false);

    setForm({
      doctorId: schedule.doctorId || "",
      dayOfWeek: schedule.dayOfWeek || DayOfWeek.MONDAY,
      startTime: normalizeScheduleTime(schedule.startTime),
      endTime: normalizeScheduleTime(schedule.endTime),
      slotDurationMinutes: Number((schedule as any).slotDurationMinutes || 30),
      active: schedule.active !== false,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setSelectedSchedule(null);
    setCreateForWholeWeek(false);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const startTime = normalizeScheduleTime(form.startTime);
    const endTime = normalizeScheduleTime(form.endTime);

    if (!form.doctorId) {
      toast.warning("Doctor tanlang");
      return;
    }

    if (!startTime) {
      toast.warning("Start time noto'g'ri");
      return;
    }

    if (!endTime) {
      toast.warning("End time noto'g'ri");
      return;
    }

    if (startTime >= endTime) {
      toast.warning("End time start time'dan katta bo'lishi kerak");
      return;
    }

    if (!createForWholeWeek && !form.dayOfWeek) {
      toast.warning("Day tanlang");
      return;
    }

    try {
      if (selectedSchedule) {
        const id = getScheduleId(selectedSchedule);

        if (!id) {
          toast.error("Schedule ID topilmadi");
          return;
        }

        await updateScheduleMutation.mutateAsync({
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes || 30),
        });

        toast.success("Doctor schedule updated successfully");
      } else if (createForWholeWeek) {
        const payload: WeeklyDoctorSchedulePayload = {
          doctorId: form.doctorId,
          startTime,
          endTime,
          active: Boolean(form.active),
        };

        await createWeeklyScheduleMutation.mutateAsync(payload);

        toast.success("Weekly doctor schedule created successfully");
      } else {
        const payload: DoctorSchedulePayload = {
          doctorId: form.doctorId,
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes || 30),
        };

        await createScheduleMutation.mutateAsync(payload);

        toast.success("Doctor schedule created successfully");
      }

      closeModal();
      await refetch();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Doctor schedule saqlashda xatolik bo'ldi"),
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  Doctor Schedule
                </h1>

                <p className="mt-1 text-sm font-medium text-slate-600">
                  Manage doctors working days and appointment slot time.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-5 w-5" />
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Total Schedules
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {flatSchedules.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Active Schedules
            </p>

            <p className="mt-3 text-3xl font-extrabold text-emerald-600">
              {flatSchedules.filter((item) => item.active).length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Doctors</p>

            <p className="mt-3 text-3xl font-extrabold text-blue-600">
              {doctors.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Selected Day</p>

            <p className="mt-3 text-3xl font-extrabold text-indigo-600">
              {selectedDay === "ALL" ? "All" : getDayShort(selectedDay)}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctor, day or time..."
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay("ALL")}
                className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                  selectedDay === "ALL"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>

              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                    selectedDay === day.value
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          {isLoading || isDoctorsLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading doctor schedules...
            </div>
          ) : isError ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">
                !
              </div>

              <p className="text-lg font-extrabold text-slate-900">
                Failed to load doctor schedules
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                {getApiErrorMessage(
                  error,
                  "Server error. Backend doctor-schedules API ichida xato bor.",
                )}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <CalendarDays className="h-8 w-8" />
              </div>

              <p className="text-lg font-extrabold text-slate-900">
                No schedules found
              </p>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Create doctor schedule to start accepting appointments.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Doctor
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Day
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
                  {filteredSchedules.map((schedule) => {
                    const scheduleId = getScheduleId(schedule);
                    const rowKey = `${scheduleId}-${schedule.dayOfWeek}`;

                    return (
                      <tr
                        key={rowKey}
                        className="border-t border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={(schedule as any).doctorName} />

                            <div>
                              <p className="font-extrabold text-slate-900">
                                {(schedule as any).doctorName}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <UserRound className="h-3.5 w-3.5" />
                                {schedule.doctorId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700">
                            {getDayLabel(schedule.dayOfWeek)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800">
                            <Clock className="h-4 w-4 text-blue-600" />
                            {normalizeScheduleTime(schedule.startTime)} -{" "}
                            {normalizeScheduleTime(schedule.endTime)}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700">
                            {(schedule as any).slotDurationMinutes || 30} min
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                              schedule.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {schedule.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(schedule)}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
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
        </div>
      </main>

      <ScheduleModal
        open={isModalOpen}
        form={form}
        doctors={doctors}
        selectedSchedule={selectedSchedule}
        isSubmitting={isSubmitting}
        createForWholeWeek={createForWholeWeek}
        onCreateForWholeWeekChange={setCreateForWholeWeek}
        onClose={closeModal}
        onChange={setForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}