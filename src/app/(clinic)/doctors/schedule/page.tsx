"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Save,
  Stethoscope,
  X,
} from "lucide-react";

import {
  useCreateDoctorSchedule,
  useDoctorSchedules,
  useUpdateDoctorSchedule,
} from "@/src/features/doctors/hooks/useDoctorSchedules";

import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";

import type {
  DayOfWeek,
  DoctorOption,
  DoctorSchedule,
  DoctorScheduleFormValues,
} from "@/src/types/doctor-schedule.types";

import { getApiErrorMessage } from "@/src/lib/api/http";
import { useToast } from "@/src/lib/hooks/Usetoast";

const days: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const initialForm: DoctorScheduleFormValues = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "18:00",
  slotDurationMinutes: 30,
  active: true,
};

const durationOptions = [
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

function getScheduleId(schedule: DoctorSchedule) {
  return schedule.id || schedule._id || "";
}

function getDoctorId(doctor: DoctorOption) {
  return doctor.id || doctor._id || "";
}

function getDoctorName(doctor: DoctorOption) {
  const fullName = `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();

  return fullName || doctor.fullName || doctor.name || getDoctorId(doctor);
}

function normalizeTimeForInput(time?: string) {
  if (!time) return "";
  return time.slice(0, 5);
}

function normalizeSchedules(data: unknown): DoctorSchedule[] {
  if (Array.isArray(data)) return data as DoctorSchedule[];

  if (data && typeof data === "object") {
    const response = data as {
      schedules?: DoctorSchedule[];
      content?: DoctorSchedule[];
      data?: DoctorSchedule[];
    };

    return response.schedules || response.content || response.data || [];
  }

  return [];
}

function getSchedulesTotal(data: unknown, schedulesLength: number) {
  if (data && typeof data === "object") {
    const response = data as {
      total?: number;
      totalElements?: number;
    };

    return response.total ?? response.totalElements ?? schedulesLength;
  }

  return schedulesLength;
}

function normalizeDoctors(data: unknown): DoctorOption[] {
  if (Array.isArray(data)) return data as DoctorOption[];

  if (data && typeof data === "object") {
    const response = data as {
      doctors?: DoctorOption[];
      content?: DoctorOption[];
      data?: DoctorOption[];
    };

    return response.doctors || response.content || response.data || [];
  }

  return [];
}

function DoctorSelector({
  doctors,
  value,
  onChange,
}: {
  doctors: DoctorOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    >
      <option value="">Select doctor</option>

      {doctors.map((doctor) => {
        const id = getDoctorId(doctor);

        return (
          <option key={id} value={id}>
            {getDoctorName(doctor)}
          </option>
        );
      })}
    </select>
  );
}

function ScheduleModal({
  isOpen,
  onClose,
  selectedSchedule,
  form,
  doctorId,
  doctors,
  onDoctorChange,
  onFormChange,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedule: DoctorSchedule | null;
  form: DoctorScheduleFormValues;
  doctorId: string;
  doctors: DoctorOption[];
  onDoctorChange: (value: string) => void;
  onFormChange: (form: DoctorScheduleFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-8 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedSchedule
                  ? "Edit Doctor Schedule"
                  : "Create Doctor Schedule"}
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                {selectedSchedule
                  ? "Update doctor working day, time and slot duration."
                  : "Create working schedule for selected doctor."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 transition hover:bg-white/60"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8 px-6 py-8 sm:px-8">
          {!selectedSchedule && (
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Doctor <span className="text-red-500">*</span>
              </label>

              <DoctorSelector
                doctors={doctors}
                value={doctorId}
                onChange={onDoctorChange}
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Day of Week <span className="text-red-500">*</span>
              </label>

              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    dayOfWeek: e.target.value as DayOfWeek,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Slot Duration <span className="text-red-500">*</span>
              </label>

              <select
                value={form.slotDurationMinutes}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    slotDurationMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {durationOptions.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Start Time <span className="text-red-500">*</span>
              </label>

              <input
                type="time"
                value={normalizeTimeForInput(form.startTime)}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    startTime: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                End Time <span className="text-red-500">*</span>
              </label>

              <input
                type="time"
                value={normalizeTimeForInput(form.endTime)}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    endTime: e.target.value,
                  })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Status
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onFormChange({
                    ...form,
                    active: true,
                  })
                }
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                  form.active
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() =>
                  onFormChange({
                    ...form,
                    active: false,
                  })
                }
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                  !form.active
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t-2 border-slate-100 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSubmitting
                ? selectedSchedule
                  ? "Updating..."
                  : "Creating..."
                : selectedSchedule
                  ? "Save Changes"
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<DoctorSchedule | null>(null);

  const [doctorId, setDoctorId] = useState("");
  const [form, setForm] = useState<DoctorScheduleFormValues>(initialForm);

  const { data, isLoading, isError } = useDoctorSchedules(page, limit);
  const { data: doctorsResponse } = useGetDoctors();

  const createScheduleMutation = useCreateDoctorSchedule();
  const updateScheduleMutation = useUpdateDoctorSchedule();

  const schedules = useMemo(() => normalizeSchedules(data), [data]);

  const schedulesTotal = useMemo(
    () => getSchedulesTotal(data, schedules.length),
    [data, schedules.length]
  );

  const doctors = useMemo(
    () => normalizeDoctors(doctorsResponse),
    [doctorsResponse]
  );

  function handleOpenCreateModal() {
    setSelectedSchedule(null);
    setDoctorId("");
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(schedule: DoctorSchedule) {
    setSelectedSchedule(schedule);

    setForm({
      dayOfWeek: schedule.dayOfWeek,
      startTime: normalizeTimeForInput(schedule.startTime),
      endTime: normalizeTimeForInput(schedule.endTime),
      slotDurationMinutes: schedule.slotDurationMinutes,
      active: schedule.active,
    });

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedSchedule(null);
    setDoctorId("");
    setForm(initialForm);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (selectedSchedule) {
        const scheduleId = getScheduleId(selectedSchedule);

        if (!scheduleId) {
          toast.error("Schedule ID not found");
          return;
        }

        await updateScheduleMutation.mutateAsync({
          id: scheduleId,
          payload: form,
        });

        toast.success("Doctor schedule updated successfully");
        handleCloseModal();
        return;
      }

      if (!doctorId) {
        toast.error("Please select doctor");
        return;
      }

      await createScheduleMutation.mutateAsync({
        doctorId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: form.slotDurationMinutes,
        active: form.active,
      });

      toast.success("Doctor schedule created successfully");
      handleCloseModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function findDoctorName(scheduleDoctorId?: string) {
    if (!scheduleDoctorId) return "-";

    const doctor = doctors.find(
      (item) => getDoctorId(item) === scheduleDoctorId
    );

    if (!doctor) return scheduleDoctorId;

    return getDoctorName(doctor);
  }

  const isSubmitting =
    createScheduleMutation.isPending || updateScheduleMutation.isPending;

  return (
    <main className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
            <CalendarDays className="text-primary-blue" />
            Doctor Schedule
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage doctors working days, time range, slot duration and active
            status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Schedule
        </button>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Schedule List
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              All doctor schedules from clinic tenant.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
            Total: {schedulesTotal}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={22} />
            Loading doctor schedules...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
            Failed to load doctor schedules.
          </div>
        )}

        {!isLoading && !isError && schedules.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Stethoscope className="text-primary-blue" size={28} />
            </div>

            <p className="text-sm font-bold text-slate-600">
              No schedules found.
            </p>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-blue px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Create First Schedule
            </button>
          </div>
        )}

        {!isLoading && !isError && schedules.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-extrabold uppercase text-slate-400">
                  <th className="px-4 py-2">Doctor</th>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Working Time</th>
                  <th className="px-4 py-2">Slot</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((schedule) => {
                  const id = getScheduleId(schedule);

                  return (
                    <tr
                      key={id}
                      className="rounded-2xl bg-slate-50 text-sm font-bold text-slate-700 transition hover:bg-blue-50/50"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                            <Stethoscope size={18} />
                          </div>

                          <div>
                            <p className="font-extrabold text-slate-900">
                              {findDoctorName(schedule.doctorId)}
                            </p>

                            <p className="text-xs font-semibold text-slate-400">
                              {schedule.doctorId || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">{schedule.dayOfWeek}</td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary-blue" />
                          {normalizeTimeForInput(schedule.startTime)} -{" "}
                          {normalizeTimeForInput(schedule.endTime)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {schedule.slotDurationMinutes} min
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            schedule.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {schedule.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(schedule)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-primary-blue shadow-sm transition hover:bg-blue-50"
                        >
                          <Edit2 size={15} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedSchedule={selectedSchedule}
        form={form}
        doctorId={doctorId}
        doctors={doctors}
        onDoctorChange={setDoctorId}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}