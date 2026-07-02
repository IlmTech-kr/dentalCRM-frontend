"use client";

/**
 * File: src/app/(dashboard)/patients/page.tsx
 */

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useCreatePatient,
  useDeletePatient,
  useGetPatients,
  useSearchPatientByPhone,
  useUpdatePatient,
} from "@/src/features/patients/hooks/usePatients";

import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { useCreateAppointment } from "@/src/features/appointments/hooks/useAppointments";
import { Gender, Role } from "@/src/lib/enums/enums.types";

import type { CreatePatientDto, Patient } from "@/src/types/patient.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import DentalLoader from "@/src/components/ui/DentalLoader";

const PAGE_SIZE = 10;

const emptyForm: CreatePatientDto = {
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  gender: Gender.MALE,
  anamnesis: "",
};

const emptyAppointmentForm = {
  doctorId: "",
  appointmentDate: "",
  startTime: "09:00",
  slotDurationMinutes: 30,
  notes: "",
};

type ModalState = "none" | "form" | "view" | "phone-search" | "appointment";

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

function getPatientPhone(patient?: Patient | null) {
  return formatPhoneNumber(patient?.phone || patient?.phoneNumber || "");
}

function getDoctorId(doctor: any) {
  return doctor?.id || doctor?._id || "";
}

function getDoctorName(doctor: any) {
  return (
    doctor?.fullName ||
    doctor?.name ||
    `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim()
  );
}

function getGenderLabel(gender?: string) {
  if (gender === Gender.MALE) return "Male";
  if (gender === Gender.FEMALE) return "Female";
  return gender || "-";
}

function getGenderBadgeClass(gender?: string) {
  if (gender === Gender.MALE) return "border-blue-200 bg-blue-50 text-blue-700";
  if (gender === Gender.FEMALE) return "border-pink-200 bg-pink-50 text-pink-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PatientsPage() {
  const toast = useToast();

  const { data: patients = [], isLoading, error: patientsError } = useGetPatients();
  const { data: doctors = [] } = useGetDoctors();

  const createMutation = useCreatePatient();
  const deleteMutation = useDeletePatient();
  const createAppointmentMutation = useCreateAppointment();

  const [form, setForm] = useState<CreatePatientDto>(emptyForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalState, setModalState] = useState<ModalState>("none");

  const updateMutation = useUpdatePatient(editingPatient?.id || "");

  const [phoneSearch, setPhoneSearch] = useState<string>("+998");
  const [phoneSearchError, setPhoneSearchError] = useState("");
  const [phoneSearchAttempted, setPhoneSearchAttempted] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const paginatedPatients = patients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const phoneDigits = extractDigits(phoneSearch);
  const shouldSearch = phoneDigits.length === 12 && phoneSearchAttempted;

  const { data: phoneSearchResults = [], isLoading: phoneSearchLoading } =
    useSearchPatientByPhone(shouldSearch ? phoneSearch : null);

  const phoneSearchResult =
    phoneSearchResults.length > 0 ? phoneSearchResults[0] : null;

  const appointmentDoctors = doctors.filter((doctor: any) =>
    doctor.roles?.includes(Role.DOCTOR)
  );

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  function openCreateModal() {
    setEditingPatient(null);
    setSelectedPatient(null);
    setForm(emptyForm);
    setPhoneSearch("+998");
    setPhoneSearchError("");
    setPhoneSearchAttempted(false);
    setModalState("phone-search");
  }

  function openEditModal(patient: Patient) {
    setEditingPatient(patient);
    setSelectedPatient(null);
    setForm({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      birthDate: patient.birthDate || "",
      phone: getPatientPhone(patient),
      gender: patient.gender,
      anamnesis: patient.anamnesis || "",
    });
    setModalState("form");
  }

  function openAppointmentModal(patient: Patient) {
    setSelectedPatient(patient);
    setEditingPatient(null);
    setAppointmentForm(emptyAppointmentForm);
    setModalState("appointment");
  }

  function closeModal() {
    setModalState("none");
    setEditingPatient(null);
    setSelectedPatient(null);
    setForm(emptyForm);
    setAppointmentForm(emptyAppointmentForm);
    setPhoneSearch("+998");
    setPhoneSearchError("");
    setPhoneSearchAttempted(false);
  }

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhoneSearchInput(value: string) {
    setPhoneSearch(formatPhoneNumber(value));
    setPhoneSearchError("");
  }

  async function handlePhoneSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = extractDigits(phoneSearch);
    if (digits.length !== 12) {
      setPhoneSearchError("Please enter a complete phone number");
      return;
    }
    setPhoneSearchAttempted(true);
    setPhoneSearchError("");
  }

  function proceedToCreateForm() {
    setForm((prev) => ({ ...prev, phone: formatPhoneNumber(phoneSearch) }));
    setModalState("form");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const payload = { ...form, phone: formatPhoneNumber(form.phone) };
      if (editingPatient) {
        await updateMutation.mutateAsync({ id: editingPatient.id, ...payload });
        toast.success("Patient updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Patient created successfully");
      }
      closeModal();
    } catch {
      toast.error("Failed to save patient");
    }
  }

  async function handleCreateAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPatient?.id) { toast.error("Patient ID topilmadi"); return; }
    if (!appointmentForm.doctorId) { toast.warning("Doctor tanlang"); return; }
    if (!appointmentForm.appointmentDate) { toast.warning("Appointment date tanlang"); return; }
    try {
      await createAppointmentMutation.mutateAsync({
        patientId: selectedPatient.id,
        doctorId: appointmentForm.doctorId,
        appointmentDate: appointmentForm.appointmentDate,
        startTime:
          appointmentForm.startTime.length === 5
            ? `${appointmentForm.startTime}:00`
            : appointmentForm.startTime,
        slotDurationMinutes: Number(appointmentForm.slotDurationMinutes),
        notes: appointmentForm.notes,
      });
      toast.success("Appointment created successfully");
      closeModal();
    } catch {
      toast.error("Appointment create qilishda xatolik bo'ldi");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this patient?");
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Patient deleted successfully");
    } catch {
      toast.error("Cannot delete patient");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-navy">Patients</h1>
          <p className="mt-1 text-text-light">Manage dental clinic patients</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#35a8f5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d8ee8]"
        >
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-color bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
          <h2 className="text-lg font-semibold text-dark-navy">Patient List</h2>
          <span className="rounded-full bg-[#35a8f5]/10 px-3 py-1 text-sm font-medium text-[#35a8f5]">
            {patients.length} patients
          </span>
        </div>

        {isLoading ? (
          <DentalLoader fullScreen={false} text="Loading patients..." />
        ) : patientsError ? (
          <div className="p-6">
            <p className="text-red-600">Failed to load patients</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Gender</th>
                    <th className="px-6 py-4">Birth Date</th>
                    <th className="px-6 py-4">Anamnesis</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.length > 0 ? (
                    paginatedPatients.map((patient, idx) => (
                      <tr key={patient.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#35a8f5]/10 font-bold text-[#35a8f5]">
                              {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-dark-navy">
                                {patient.firstName} {patient.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {getPatientPhone(patient)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getGenderBadgeClass(patient.gender)}`}>
                            {getGenderLabel(patient.gender)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{patient.birthDate}</td>
                        <td className="max-w-[220px] truncate px-6 py-4 text-slate-600">
                          {patient.anamnesis || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setSelectedPatient(patient); setModalState("view"); }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openAppointmentModal(patient)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                              title="Create Appointment"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(patient)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(patient.id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No patients found. Create your first patient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border-color px-6 py-4">
                {/* Left: counter */}
                <p className="text-sm text-text-light">
                  <span className="font-semibold text-dark-navy">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, patients.length)}</span>
                  {" "}/{" "}
                  <span className="font-semibold text-dark-navy">{patients.length}</span> ta bemor
                </p>

                {/* Right: pagination */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5] disabled:opacity-30"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    )
                    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                      if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                        acc.push("...");
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, idx) =>
                      page === "..." ? (
                        <span key={`dot-${idx}`} className="flex h-9 w-6 items-center justify-center text-sm text-slate-400">…</span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page as number)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition ${
                            currentPage === page
                              ? "border-[#35a8f5] bg-[#35a8f5] text-white shadow-sm shadow-blue-200"
                              : "border-border-color text-slate-500 hover:border-[#35a8f5] hover:text-[#35a8f5]"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5] disabled:opacity-30"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Phone Search Modal */}
      {modalState === "phone-search" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
              <h2 className="text-xl font-bold text-dark-navy">Check Patient by Phone</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {phoneSearchResult ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="mt-0.5 flex-shrink-0 text-green-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">Patient Found!</p>
                      <p className="mt-0.5 text-xs text-green-700">This patient already exists in the system</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Info label="Name" value={`${phoneSearchResult.firstName} ${phoneSearchResult.lastName}`} />
                    <Info label="Phone" value={getPatientPhone(phoneSearchResult)} />
                    <Info label="Gender" value={getGenderLabel(phoneSearchResult.gender)} />
                    <Info label="Birth Date" value={phoneSearchResult.birthDate} />
                    <Info label="Anamnesis" value={phoneSearchResult.anamnesis || "-"} />
                  </div>
                  <div className="flex gap-3 border-t border-border-color pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                      Close
                    </button>
                    <button type="button" onClick={() => openAppointmentModal(phoneSearchResult)} className="flex-1 rounded-xl bg-[#35a8f5] px-4 py-3 font-semibold text-white hover:bg-[#1d8ee8]">
                      Create Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePhoneSearch} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneSearch}
                        onChange={(e) => handlePhoneSearchInput(e.target.value)}
                        placeholder="+998934919100"
                        maxLength={13}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-lg font-semibold tracking-wider outline-none focus:ring-2 focus:ring-[#35a8f5]"
                      />
                      <Search className="absolute right-3 top-3.5 text-slate-400" size={18} />
                    </div>
                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-slate-600">
                        Phone: <span className="font-semibold text-[#35a8f5]">{phoneSearch || "+998934919100"}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Enter number without spaces. Example: +998934919100</p>
                  </div>

                  {phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
                      <p className="text-sm text-red-700">{phoneSearchError}</p>
                    </div>
                  )}

                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-[#35a8f5]" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-dark-navy">No Patient Found</p>
                        <p className="mt-0.5 text-xs text-slate-600">This phone number is not in the system. You can create a new patient.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-border-color pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={phoneSearchLoading || phoneDigits.length !== 12}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#35a8f5] px-4 py-3 font-semibold text-white hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {phoneSearchLoading ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Searching...</>
                      ) : (
                        <><Search size={16} /> Search Patient</>
                      )}
                    </button>
                  </div>

                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <button
                      type="button"
                      onClick={proceedToCreateForm}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus size={16} /> Create New Patient
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {modalState === "appointment" && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-dark-navy">Create Appointment</h2>
                <p className="mt-1 text-sm text-text-light">
                  {selectedPatient.firstName} {selectedPatient.lastName} uchun appointment
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 p-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase text-[#35a8f5]">Patient</p>
                <p className="mt-1 font-semibold text-dark-navy">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="mt-1 text-sm text-text-light">{getPatientPhone(selectedPatient)}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Doctor</label>
                <select
                  value={appointmentForm.doctorId}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
                >
                  <option value="">Select doctor</option>
                  {appointmentDoctors.map((doctor: any) => {
                    const doctorId = getDoctorId(doctor);
                    return <option key={doctorId} value={doctorId}>{getDoctorName(doctor) || doctorId}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={appointmentForm.startTime}
                    onChange={(e) => setAppointmentForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Slot Duration</label>
                <select
                  value={appointmentForm.slotDurationMinutes}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Notes</label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Birinchi ko'rik"
                  className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border-color pt-4">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="rounded-xl bg-[#35a8f5] px-5 py-3 font-semibold text-white hover:bg-[#1d8ee8] disabled:opacity-50"
                >
                  {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Patient Modal */}
      {modalState === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
              <h2 className="text-xl font-bold text-dark-navy">
                {editingPatient ? "Edit Patient" : "Create Patient"}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]" />
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]" />
              <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]" />
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                placeholder="+998934919100"
                maxLength={13}
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5]"
              />
              <select name="gender" value={form.gender} onChange={handleChange} className={`rounded-xl border px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-[#35a8f5] ${getGenderBadgeClass(form.gender)}`}>
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
              </select>
              <textarea name="anamnesis" value={form.anamnesis} onChange={handleChange} placeholder="Anamnesis (medical history)" className="min-h-[110px] rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#35a8f5] md:col-span-2" />

              <div className="flex justify-end gap-3 border-t border-border-color pt-4 md:col-span-2">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-[#35a8f5] px-5 py-3 font-semibold text-white hover:bg-[#1d8ee8] disabled:opacity-50"
                >
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {modalState === "view" && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark-navy">Patient Details</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <Info label="Name" value={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />
              <Info label="Phone" value={getPatientPhone(selectedPatient)} />
              <Info label="Gender" value={getGenderLabel(selectedPatient.gender)} />
              <Info label="Birth Date" value={selectedPatient.birthDate} />
              <Info label="Anamnesis" value={selectedPatient.anamnesis || "-"} />
            </div>
            <div className="mt-6 flex gap-3 border-t border-border-color pt-4">
              <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                Close
              </button>
              <button type="button" onClick={() => openAppointmentModal(selectedPatient)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
                Create Appointment
              </button>
              <button type="button" onClick={() => openEditModal(selectedPatient)} className="flex-1 rounded-xl bg-[#35a8f5] px-4 py-3 font-semibold text-white hover:bg-[#1d8ee8]">
                Edit Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-dark-navy">{value}</p>
    </div>
  );
}