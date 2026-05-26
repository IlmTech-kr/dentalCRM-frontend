"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  X,
  Phone,
} from "lucide-react";

import {
  useCreateAppointment,
  useDeleteAppointment,
  useGetAppointments,
  useUpdateAppointment,
} from "@/src/features/appointments/hooks/useAppointments";

import { useGetPatients } from "@/src/features/patients/hooks/usePatients";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";

import { getApiErrorMessage } from "@/src/lib/api/http";

import type {
  Appointment,
  CreateAppointmentDto,
} from "@/src/types/appointment.types";
import { useToast } from "@/src/lib/hooks/Usetoast";

const initialForm: CreateAppointmentDto = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  startTime: "",
  slotDurationMinutes: 30,
  notes: "",
};

const durationOptions = [
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hrs" },
];

// Avatar component
function AvatarWithInitials({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const gradients = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-amber-400 to-amber-600",
    "from-green-400 to-green-600",
  ];

  const gradient = gradients[name.charCodeAt(0) % gradients.length];

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold text-white shadow-md`}
    >
      {initials}
    </div>
  );
}

// Beautiful Calendar Picker - Matches screenshot exactly
function CalendarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(value || new Date())
  );

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDayArray = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    // Adjust for Monday start (0 = Monday)
    const firstDay = (firstDayOfMonth(currentMonth) + 6) % 7;

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number | null) => {
    if (!day) return;

    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    const dateString = selectedDate.toISOString().split("T")[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const days = getDayArray();
  
  const selectedDate = value ? new Date(value) : null;
  const selectedDay = selectedDate ? selectedDate.getDate() : null;
  const isCurrentMonth =
    selectedDate &&
    selectedDate.getMonth() === currentMonth.getMonth() &&
    selectedDate.getFullYear() === currentMonth.getFullYear();

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4 text-left font-medium text-slate-900 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Date</p>
              <p className="text-sm font-semibold text-slate-900">
                {value ? formatDate(value) : "Select date"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            {/* Calendar Header */}
            <div className="mb-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {monthNames[currentMonth.getMonth()]}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day Names */}
            <div className="mb-6 grid grid-cols-7 gap-3">
              {dayNames.map((day) => (
                <p
                  key={day}
                  className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {day}
                </p>
              ))}
            </div>

            {/* Days Grid */}
            <div className="mb-8 grid grid-cols-7 gap-3">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={!day}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold transition ${
                    !day
                      ? "text-slate-200"
                      : isCurrentMonth && day === selectedDay
                        ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg hover:from-purple-600 hover:to-indigo-700"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Selected Date Display */}
            <div className="mb-6 text-center">
              <p className="text-sm text-slate-600">
                {value ? formatDate(value) : "No date selected"}
              </p>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition hover:from-purple-600 hover:to-indigo-700"
            >
              Set Date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Beautiful Time Picker
function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(
    value ? parseInt(value.split(":")[0]) : 9
  );
  const [minute, setMinute] = useState(
    value ? parseInt(value.split(":")[1]) : 0
  );

  const handleConfirm = () => {
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const timeDisplay = value
    ? value.slice(0, 5)
    : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4 text-left font-medium text-slate-900 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Start Time</p>
              <p className="text-sm font-semibold text-slate-900">
                {timeDisplay}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <p className="mb-6 text-center text-lg font-bold text-slate-900">
              Select Time
            </p>

            {/* Time Selectors */}
            <div className="mb-6 flex gap-4">
              {/* Hours */}
              <div className="flex-1">
                <p className="mb-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Hour
                </p>
                <div className="flex h-48 flex-col overflow-y-auto rounded-xl border-2 border-slate-200 bg-slate-50">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour(h)}
                      className={`flex-1 border-b border-slate-100 px-2 py-2 text-base font-bold transition ${
                        hour === h
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          : "text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center">
                <p className="text-3xl font-bold text-slate-400">:</p>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <p className="mb-3 text-center text-xs font-bold text-slate-600 uppercase">
                  Minute
                </p>
                <div className="flex h-48 flex-col overflow-y-auto rounded-xl border-2 border-slate-200 bg-slate-50">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      className={`flex-1 border-b border-slate-100 px-2 py-2 text-base font-bold transition ${
                        minute === m
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          : "text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="mb-6 rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-600">Selected Time</p>
              <p className="text-2xl font-bold text-slate-900">{timeDisplay}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Beautiful Duration Selector
function DurationSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="w-full">
      <p className="mb-4 text-sm font-bold text-slate-900">Duration</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {durationOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`group relative rounded-xl px-3 py-3 text-center transition ${
              value === option.value
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
                : "border-2 border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <p
              className={`text-xs font-bold transition ${
                value === option.value ? "text-white" : "text-slate-700"
              }`}
            >
              {option.label}
            </p>

            {/* Checkmark */}
            {value === option.value && (
              <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Enhanced doctor selector
function DoctorSelector({
  doctors,
  value,
  onChange,
}: {
  doctors: any[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDoctor = doctors.find((d) => d.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4 text-left font-medium text-slate-900 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <div className="flex items-center justify-between">
          {selectedDoctor ? (
            <div className="flex items-center gap-3">
              <AvatarWithInitials
                name={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600">Doctor</p>
                <p className="font-semibold text-slate-900">
                  {selectedDoctor.firstName} {selectedDoctor.lastName}
                </p>
                {selectedDoctor.phoneNumber && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {selectedDoctor.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-600">Doctor</p>
              <p className="text-sm text-slate-500">Select a doctor</p>
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-40 mt-3 max-h-64 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
          <div className="space-y-1 p-3">
            {doctors.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                No doctors available
              </div>
            ) : (
              doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    onChange(doctor.id);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    value === doctor.id
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarWithInitials
                      name={`${doctor.firstName} ${doctor.lastName}`}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {doctor.firstName} {doctor.lastName}
                      </p>
                      <div className="space-y-0.5">
                        {doctor.email && (
                          <p className="text-xs text-slate-500">{doctor.email}</p>
                        )}
                        {doctor.phoneNumber && (
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />
                            {doctor.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {value === doctor.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced patient selector
function PatientSelector({
  patients,
  value,
  onChange,
}: {
  patients: any[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPatient = patients.find((p) => p.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4 text-left font-medium text-slate-900 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <div className="flex items-center justify-between">
          {selectedPatient ? (
            <div className="flex items-center gap-3">
              <AvatarWithInitials
                name={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600">Patient</p>
                <p className="font-semibold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                {selectedPatient.phoneNumber && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {selectedPatient.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-600">Patient</p>
              <p className="text-sm text-slate-500">Select a patient</p>
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-40 mt-3 max-h-64 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
          <div className="space-y-1 p-3">
            {patients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                No patients available
              </div>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    onChange(patient.id);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    value === patient.id
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarWithInitials
                      name={`${patient.firstName} ${patient.lastName}`}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      {patient.phoneNumber && (
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          {patient.phoneNumber}
                        </p>
                      )}
                    </div>
                    {value === patient.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Appointment modal component
interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAppointment: Appointment | null;
  form: CreateAppointmentDto;
  onFormChange: (form: CreateAppointmentDto) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  patients: any[];
  doctors: any[];
}

function AppointmentModal({
  isOpen,
  onClose,
  selectedAppointment,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
  patients,
  doctors,
}: AppointmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-8 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedAppointment ? "Edit Appointment" : "Schedule New Appointment"}
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {selectedAppointment
                  ? "Update appointment details"
                  : "Create a new appointment with patient and doctor"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 transition hover:bg-white/50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-8 px-6 py-8 sm:px-8">
          {/* Patient and Doctor Row */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Patient <span className="text-red-500">*</span>
              </label>
              <PatientSelector
                patients={patients}
                value={form.patientId}
                onChange={(patientId) =>
                  onFormChange({ ...form, patientId })
                }
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Doctor <span className="text-red-500">*</span>
              </label>
              <DoctorSelector
                doctors={doctors}
                value={form.doctorId}
                onChange={(doctorId) =>
                  onFormChange({ ...form, doctorId })
                }
              />
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Date <span className="text-red-500">*</span>
              </label>
              <CalendarPicker
                value={form.appointmentDate}
                onChange={(appointmentDate) =>
                  onFormChange({ ...form, appointmentDate })
                }
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Start Time <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={form.startTime}
                onChange={(startTime) =>
                  onFormChange({
                    ...form,
                    startTime,
                  })
                }
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Duration <span className="text-red-500">*</span>
            </label>
            <DurationSelector
              value={form.slotDurationMinutes}
              onChange={(slotDurationMinutes) =>
                onFormChange({
                  ...form,
                  slotDurationMinutes,
                })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="e.g., First checkup, Follow-up visit, Treatment notes..."
              rows={4}
              className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Actions */}
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
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? selectedAppointment
                  ? "Updating..."
                  : "Creating..."
                : selectedAppointment
                  ? "Save Changes"
                  : "Schedule Appointment"}
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

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [form, setForm] = useState<CreateAppointmentDto>(initialForm);

  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch,
  } = useGetAppointments(page, limit);

  const { data: patients = [] } = useGetPatients();
  const { data: doctors = [] } = useGetDoctors();

  const createAppointmentMutation = useCreateAppointment();

  const updateAppointmentMutation = useUpdateAppointment(
    selectedAppointment?.id || ""
  );

  const deleteAppointmentMutation = useDeleteAppointment();

  useEffect(() => {
    if (!patientIdFromUrl) return;
    if (hasOpenedFromPatientRef.current) return;

    setSelectedAppointment(null);
    setForm({
      ...initialForm,
      patientId: patientIdFromUrl,
    });

    setIsModalOpen(true);
    hasOpenedFromPatientRef.current = true;
  }, [patientIdFromUrl]);

  const filteredAppointments = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return appointments;

    return appointments.filter((appointment) => {
      const patientName = getPatientName(appointment.patientId).toLowerCase();
      const doctorName = getDoctorName(appointment.doctorId).toLowerCase();

      const date = appointment.appointmentDate?.toLowerCase() || "";
      const time = appointment.startTime?.toLowerCase() || "";
      const notes = appointment.notes?.toLowerCase() || "";

      return (
        patientName.includes(value) ||
        doctorName.includes(value) ||
        date.includes(value) ||
        time.includes(value) ||
        notes.includes(value)
      );
    });
  }, [appointments, search, patients, doctors]);

  function getPatientName(patientId: string) {
    const patient = patients.find((item) => item.id === patientId);

    if (!patient) return patientId || "-";

    return `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
  }

  function getDoctorName(doctorId: string) {
    const doctor = doctors.find((item) => item.id === doctorId);

    if (!doctor) return doctorId || "-";

    return `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
  }

  function handleOpenCreateModal() {
    setSelectedAppointment(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(appointment: Appointment) {
    setSelectedAppointment(appointment);

    setForm({
      patientId: appointment.patientId || "",
      doctorId: appointment.doctorId || "",
      appointmentDate: appointment.appointmentDate || "",
      startTime: appointment.startTime || "",
      slotDurationMinutes: appointment.slotDurationMinutes || 30,
      notes: appointment.notes || "",
    });

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setSelectedAppointment(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.patientId) {
      toast.warning("Patient tanlang");
      return;
    }

    if (!form.doctorId) {
      toast.warning("Doctor tanlang");
      return;
    }

    if (!form.appointmentDate) {
      toast.warning("Appointment date kiriting");
      return;
    }

    if (!form.startTime) {
      toast.warning("Start time kiriting");
      return;
    }

    if (!form.slotDurationMinutes || form.slotDurationMinutes <= 0) {
      toast.warning("Slot duration noto'g'ri");
      return;
    }

    try {
      const payload: CreateAppointmentDto = {
        patientId: form.patientId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        slotDurationMinutes: Number(form.slotDurationMinutes),
        notes: form.notes || "",
      };

      if (selectedAppointment) {
        await updateAppointmentMutation.mutateAsync(payload);
        toast.success("Appointment updated successfully");
      } else {
        await createAppointmentMutation.mutateAsync(payload);
        toast.success("Appointment created successfully");
      }

      handleCloseModal();
      await refetch();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Appointment saqlashda xatolik bo'ldi")
      );
    }
  }

  async function handleDeleteAppointment(appointment: Appointment) {
    if (!appointment.id) {
      toast.error("Appointment ID topilmadi");
      return;
    }

    const confirmed = confirm("Appointmentni o'chirmoqchimisiz?");

    if (!confirmed) return;

    try {
      await deleteAppointmentMutation.mutateAsync(appointment.id);

      toast.success("Appointment deleted successfully");
      await refetch();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Appointment delete qilishda xatolik bo'ldi")
      );
    }
  }

  const isSubmitting =
    createAppointmentMutation.isPending || updateAppointmentMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage patient appointments, doctors, dates, and visit times.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Add Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, date, or notes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Appointments Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isError ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">⚠️</div>
              <p className="text-sm font-medium text-red-600 mb-4">
                Failed to load appointments. Please try again.
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Time
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        <div className="inline-flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                          Loading appointments...
                        </div>
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        No appointments found
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-t border-slate-100 transition hover:bg-blue-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarWithInitials
                              name={getPatientName(appointment.patientId)}
                            />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {getPatientName(appointment.patientId)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {appointment.patientId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarWithInitials
                              name={getDoctorName(appointment.doctorId)}
                            />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {getDoctorName(appointment.doctorId)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {appointment.doctorId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {appointment.appointmentDate || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {appointment.startTime || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {appointment.slotDurationMinutes} min
                          </span>
                        </td>

                        <td className="max-w-xs px-6 py-4">
                          <p className="line-clamp-2 text-sm text-slate-600">
                            {appointment.notes || "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(appointment)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteAppointment(appointment)
                              }
                              disabled={deleteAppointmentMutation.isPending}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedAppointment={selectedAppointment}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        patients={patients}
        doctors={doctors}
      />
    </div>
  );
}