"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Trash2, X, Search, AlertCircle, CheckCircle, Loader } from "lucide-react";

// ✅ IMPORT REACT QUERY HOOKS
import {
  useGetPatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useSearchPatientByPhone,
} from "@/src/features/patients/hooks/usePatients";

import type { CreatePatientDto, Patient } from "@/src/types/patient.types";
import { useToast } from "@/src/lib/hooks/Usetoast";

const emptyForm: CreatePatientDto = {
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  gender: "MALE",
  anamnesis: "",
};

const toast = useToast();


type ModalState = "none" | "form" | "view" | "phone-search";

/**
 * Format phone number to +998 XX XXX XX XX format
 */
function formatPhoneNumber(input: string): string {
  if (!input) return "";

  const digits = input.replace(/\D/g, "");

  if (!digits) return "";

  let normalized = digits;
  if (digits.startsWith("998")) {
    normalized = digits;
  } else if (digits.startsWith("98")) {
    normalized = "9" + digits;
  } else if (digits.startsWith("9")) {
    normalized = "998" + digits.substring(1);
  } else {
    normalized = "998" + digits;
  }

  normalized = normalized.substring(0, 12);

  if (normalized.length === 12) {
    return `+${normalized.substring(0, 3)} ${normalized.substring(3, 5)} ${normalized.substring(5, 8)} ${normalized.substring(8, 10)} ${normalized.substring(10, 12)}`;
  }

  if (normalized.length >= 3) {
    let formatted = `+${normalized.substring(0, 3)}`;
    if (normalized.length > 3) {
      formatted += ` ${normalized.substring(3, 5)}`;
    }
    if (normalized.length > 5) {
      formatted += ` ${normalized.substring(5, 8)}`;
    }
    if (normalized.length > 8) {
      formatted += ` ${normalized.substring(8, 10)}`;
    }
    if (normalized.length > 10) {
      formatted += ` ${normalized.substring(10, 12)}`;
    }
    return formatted;
  }

  return normalized.length > 0 ? `+${normalized}` : "";
}

/**
 * Extract only digits from phone number
 */
function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function PatientsPage() {
  // ✅ USE REACT QUERY HOOKS
  const { data: patients = [], isLoading, error: patientsError } = useGetPatients();
  const createMutation = useCreatePatient();
  const deleteMutation = useDeletePatient();

  const [form, setForm] = useState<CreatePatientDto>(emptyForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalState, setModalState] = useState<ModalState>("none");

  // Phone search state
  const [phoneSearch, setPhoneSearch] = useState<string>("+998 ");
  const [phoneSearchError, setPhoneSearchError] = useState("");
  const [phoneSearchAttempted, setPhoneSearchAttempted] = useState(false);

  // ✅ USE PHONE SEARCH HOOK
  const phoneDigits = extractDigits(phoneSearch);
  const shouldSearch = phoneDigits.length === 12 && phoneSearchAttempted;
  const {
    data: phoneSearchResults = [],
    isLoading: phoneSearchLoading,
  } = useSearchPatientByPhone(shouldSearch ? phoneSearch : null);

  const phoneSearchResult = phoneSearchResults.length > 0 ? phoneSearchResults[0] : null;

  function openCreateModal() {
    setEditingPatient(null);
    setForm(emptyForm);
    setPhoneSearch("+998 ");
    setPhoneSearchError("");
    setPhoneSearchAttempted(false);
    setModalState("phone-search");
  }

  function openEditModal(patient: Patient) {
    setEditingPatient(patient);
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate,
      phone: patient.phone,
      gender: patient.gender,
      anamnesis: patient.anamnesis,
    });
    setModalState("form");
  }

  function closeModal() {
    setModalState("none");
    setEditingPatient(null);
    setForm(emptyForm);
    setPhoneSearch("+998 ");
    setPhoneSearchError("");
    setPhoneSearchAttempted(false);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /**
   * Handle phone search input with +998 prefix
   */
  function handlePhoneSearchInput(value: string) {
    if (!value.startsWith("+998")) {
      setPhoneSearch("+998 ");
      return;
    }

    const cleaned = value.replace(/\s+/g, " ");
    setPhoneSearch(cleaned);
    setPhoneSearchError("");
  }

  /**
   * Handle phone search submission
   */
  async function handlePhoneSearch(e: React.FormEvent) {
    e.preventDefault();

    const digits = phoneSearch.replace(/\D/g, "");

    if (digits.length < 12) {
      setPhoneSearchError("Please enter a complete phone number");
      return;
    }

    setPhoneSearchAttempted(true);
    setPhoneSearchError("");

    // React Query will automatically fetch due to useSearchPatientByPhone hook
  }

  function proceedToCreateForm() {
    const formattedPhone = formatPhoneNumber(phoneSearch);
    setForm((prev) => ({
      ...prev,
      phone: formattedPhone,
    }));
    setModalState("form");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (editingPatient) {
        // ✅ PROPERLY CALL useUpdatePatient with patientId
        const updateMutation = useUpdatePatient(editingPatient.id);
        await updateMutation.mutateAsync({
          id: editingPatient.id,
          ...form,
        });
      } else {
        // ✅ USE CREATE MUTATION
        await createMutation.mutateAsync(form);
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save patient:", error);
      alert(error instanceof Error ? error.message : "Failed to save patient");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this patient?");
    if (!confirmed) return;

    try {
      // ✅ USE DELETE MUTATION
      await deleteMutation.mutateAsync(id);
    toast.success("Patient deleted successfully");

    } catch (error) {
      console.error("Failed to delete patient:", error);
    toast.error("Cannot delete patient");

    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
          <p className="mt-1 text-slate-500">
            Manage dental clinic patients
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Patient
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Patient List
          </h2>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {patients.length} patients
          </span>
        </div>

        {/* ✅ USE QUERY STATE */}
        {isLoading ? (
          <p className="p-6 text-slate-500">Loading patients...</p>
        ) : patientsError ? (
          <div className="p-6">
            <p className="text-red-600">Failed to load patients</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Birth Date</th>
                  <th className="px-6 py-4">Anamnesis</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {patient.firstName?.[0]}
                            {patient.lastName?.[0]}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {patient.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {patient.phone}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {patient.gender}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {patient.birthDate}
                      </td>

                      <td className="max-w-[220px] truncate px-6 py-4 text-slate-600">
                        {patient.anamnesis || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setModalState("view");
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => openEditModal(patient)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
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
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No patients found. Create your first patient.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PHONE SEARCH MODAL */}
      {modalState === "phone-search" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                Check Patient by Phone
              </h2>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* If patient found */}
              {phoneSearchResult ? (
                <div className="space-y-4">
                  {/* Success message */}
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="mt-0.5 flex-shrink-0 text-green-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">
                        Patient Found!
                      </p>
                      <p className="mt-0.5 text-xs text-green-700">
                        This patient already exists in the system
                      </p>
                    </div>
                  </div>

                  {/* Patient information */}
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">Name</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {phoneSearchResult.firstName} {phoneSearchResult.lastName}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">Phone</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {phoneSearchResult.phone}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">Gender</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {phoneSearchResult.gender}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">Birth Date</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {phoneSearchResult.birthDate}
                      </p>
                    </div>

                    {phoneSearchResult.anamnesis && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">Anamnesis</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {phoneSearchResult.anamnesis}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 border-t border-slate-200 pt-4">
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPatient(phoneSearchResult);
                        setModalState("view");
                      }}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePhoneSearch} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneSearch}
                        onChange={(e) => handlePhoneSearchInput(e.target.value)}
                        onFocus={(e) => {
                          if (!e.target.value.startsWith("+998")) {
                            setPhoneSearch("+998 ");
                          }
                        }}
                        placeholder="+998 90 123 45 67"
                        maxLength={17}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-lg font-semibold tracking-wider outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute right-3 top-3.5 text-slate-400" size={18} />
                    </div>

                    <div className="mt-2 rounded-lg bg-blue-50 p-3 border border-blue-200">
                      <p className="text-xs text-slate-600">
                        Formatted:{" "}
                        <span className="font-semibold text-blue-700">
                          {phoneSearch || "+998 "}
                        </span>
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Automatically starts with +998. Just enter the remaining 9 digits.
                    </p>
                  </div>

                  {/* ✅ ERROR MESSAGE */}
                  {phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
                      <p className="text-sm text-red-700">{phoneSearchError}</p>
                    </div>
                  )}

                  {/* Not found message */}
                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-blue-600" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">No Patient Found</p>
                        <p className="mt-0.5 text-xs text-blue-700">
                          This phone number is not in the system. You can create a new patient.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    {/* ✅ USE QUERY LOADING STATE */}
                    <button
                      type="submit"
                      disabled={phoneSearchLoading || phoneDigits.length < 12}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {phoneSearchLoading ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search size={16} />
                          Search Patient
                        </>
                      )}
                    </button>
                  </div>

                  {/* Proceed to create button - shown after search attempted with no result */}
                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <button
                      type="button"
                      onClick={proceedToCreateForm}
                      className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Create New Patient
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT FORM MODAL */}
      {modalState === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPatient ? "Edit Patient" : "Create Patient"}
              </h2>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2"
            >
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    phone: formatted,
                  }));
                }}
                placeholder="+998 90 123 45 67"
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>

              <textarea
                name="anamnesis"
                value={form.anamnesis}
                onChange={handleChange}
                placeholder="Anamnesis (medical history)"
                className="min-h-[110px] rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
              />

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 md:col-span-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                {/* ✅ SUBMIT BUTTON WITH MUTATION STATE */}
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PATIENT MODAL */}
      {modalState === "view" && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Patient Details
              </h2>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <Info label="Name" value={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />
              <Info label="Phone" value={selectedPatient.phone} />
              <Info label="Gender" value={selectedPatient.gender} />
              <Info label="Birth Date" value={selectedPatient.birthDate} />
              <Info label="Anamnesis" value={selectedPatient.anamnesis || "-"} />
            </div>

            <div className="mt-6 flex gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                onClick={() => openEditModal(selectedPatient)}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
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
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}