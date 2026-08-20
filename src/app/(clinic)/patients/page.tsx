"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
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
import { useAuthStore } from "@/src/store/auth.store";
import { Gender, Role } from "@/src/lib/enums/enums.types";

import type { CreatePatientDto, Patient } from "@/src/types/patient.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { useConfirm } from "@/src/lib/hooks/Useconfirm";
import { getApiErrorMessage } from "@/src/lib/api/http";
import DentalLoader, { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { DateInput } from "@/src/components/ui/DateInput";
import { TimeInput } from "@/src/components/ui/TimeInput";

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

/** Yangi appointment modal ochilganda sana bo'sh emas, bugungi kun bilan boshlanadi. */
function createEmptyAppointmentForm() {
  return { ...emptyAppointmentForm, appointmentDate: todayYMDValue() };
}

type ModalState =
  | "none"
  | "form"
  | "view"
  | "phone-search"
  | "appointment"
  | "start-confirm";

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

function todayYMDValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

function getGenderLabel(
  gender: string | undefined,
  t: ReturnType<typeof useTranslations>
) {
  if (gender === Gender.MALE) return t("gender.male");
  if (gender === Gender.FEMALE) return t("gender.female");
  return gender || "-";
}

function getGenderBadgeClass(gender?: string) {
  if (gender === Gender.MALE) return "border-blue-200 bg-blue-50 text-blue-700";
  if (gender === Gender.FEMALE) return "border-pink-200 bg-pink-50 text-pink-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PatientsPage() {
  const t = useTranslations("patients");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const isReceptionist = useAuthStore((state) => state.isReceptionist());

  const { data: patients = [], isLoading, error: patientsError } = useGetPatients();
  const { data: doctors = [] } = useGetDoctors();

  const createMutation = useCreatePatient();
  const deleteMutation = useDeletePatient();
  const createAppointmentMutation = useCreateAppointment();

  const [form, setForm] = useState<CreatePatientDto>(emptyForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalState, setModalState] = useState<ModalState>("none");

  // Yangi yaratilgan patient — "start-confirm" modalida ishlatiladi
  const [pendingNewPatient, setPendingNewPatient] = useState<Patient | null>(null);

  const updateMutation = useUpdatePatient();

  const [phoneSearch, setPhoneSearch] = useState<string>("+998");
  const [phoneSearchError, setPhoneSearchError] = useState("");
  const [phoneSearchAttempted, setPhoneSearchAttempted] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(createEmptyAppointmentForm);

  // Jadval qidiruvi — telefon raqami/ism bo'yicha
  const [tableSearch, setTableSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Backend tartiblashni (sortBy/sortDirection) qo'llab-quvvatlashi
  // tasdiqlanmagan, shuning uchun "eng oxirgi qo'shilgan bemor birinchi
  // ko'rinishi" talabini bu yerda, to'liq ro'yxat ustida, klient tomonda
  // kafolatlaymiz: createdAt bo'lsa shu, bo'lmasa Mongo ObjectId (id ning
  // dastlabki qismi yaratilish vaqtini o'zida saqlaydi) kamayish
  // tartibida — ikkalasi ham eng yangisini birinchi qiladi.
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return sortedPatients;

    const digits = extractDigits(tableSearch);
    const isPhoneQuery = digits.length > 0 && /^[\d\s+()-]+$/.test(tableSearch.trim());

    return sortedPatients.filter((patient) => {
      // Telefon raqami bo'yicha moslik
      if (isPhoneQuery) {
        const patientDigits = extractDigits(
          patient.phone || patient.phoneNumber || ""
        );
        if (patientDigits.includes(digits)) return true;
      }

      // Ism / familiya bo'yicha moslik
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
      const reversedName = `${patient.lastName || ""} ${patient.firstName || ""}`.toLowerCase();

      return fullName.includes(query) || reversedName.includes(query);
    });
  }, [sortedPatients, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const totalPatients = filteredPatients.length;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleTableSearchChange(value: string) {
    setTableSearch(value);
    setCurrentPage(1);
  }

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
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * "Molajani boshlash" — patientning treatment sahifasiga to'g'ridan-to'g'ri
   * o'tkazadi (appointmentId bermasdan). Treatment sahifasida "Visit qo'shish"
   * bosilganda backend appointmentId'siz visitni qabul qiladi va doctorId +
   * joriy vaqt asosida appointmentni avtomatik yaratadi.
   */
  function goToTreatment(patient: Patient | null) {
    if (!patient?.id) {
      toast.error(t("toast.patientIdNotFound"));
      return;
    }
    router.push(`/treatments/${patient.id}`);
  }

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
    setAppointmentForm(createEmptyAppointmentForm());
    setModalState("appointment");
  }

  function closeModal() {
    setModalState("none");
    setEditingPatient(null);
    setSelectedPatient(null);
    setPendingNewPatient(null);
    setForm(emptyForm);
    setAppointmentForm(createEmptyAppointmentForm());
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
      setPhoneSearchError(t("phoneSearchModal.incompleteError"));
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
        await updateMutation.mutateAsync({
          id: editingPatient.id,
          firstName: payload.firstName,
          lastName: payload.lastName,
          birthDate: payload.birthDate,
          phone: payload.phone,
          gender: payload.gender,
          anamnesis: payload.anamnesis,
        });

        toast.success(t("toast.patientUpdated"));
        closeModal();
        return;
      }

      const createdPatient = await createMutation.mutateAsync(payload);
      toast.success(t("toast.patientCreated"));
      setForm(emptyForm);

      // Yangi patient yaratilgandan keyin — modal ichida so'raymiz.
      // Receptionist davolashni boshlay olmaydi, shuning uchun bu modal
      // unga ko'rsatilmaydi — shunchaki yopiladi.
      if (isReceptionist) {
        closeModal();
        return;
      }
      setPendingNewPatient(createdPatient);
      setModalState("start-confirm");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toast.saveFailed")));
    }
  }

  async function handleCreateAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPatient?.id) { toast.error(t("toast.patientIdNotFound")); return; }
    if (!appointmentForm.doctorId) { toast.warning(t("toast.selectDoctor")); return; }
    if (!appointmentForm.appointmentDate) { toast.warning(t("toast.selectDate")); return; }
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
      toast.success(t("toast.appointmentCreated"));
      closeModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toast.appointmentCreateFailed")));
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: tCommon("actions.delete"),
      message: t("deleteConfirm.message"),
      confirmLabel: tCommon("actions.delete"),
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("toast.patientDeleted"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toast.deleteFailed")));
    }
  }

  // ---------------------------------------------------------------------------
  // Shared row/card action buttons
  // ---------------------------------------------------------------------------

  function renderPatientActionButtons(patient: Patient) {
    return (
      <>
        <Tooltip label={tCommon("actions.view")}>
          <button
            type="button"
            onClick={() => { setSelectedPatient(patient); setModalState("view"); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-medical-cyan/40 hover:bg-medical-cyan/10 hover:text-medical-cyan"
            aria-label={tCommon("actions.view")}
          >
            <Eye size={16} />
          </button>
        </Tooltip>
        {!isReceptionist && (
          <Tooltip label={t("actions.startTreatment")}>
            <button
              type="button"
              onClick={() => goToTreatment(patient)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label={t("actions.startTreatment")}
            >
              <Play size={16} />
            </button>
          </Tooltip>
        )}
        <Tooltip label={t("actions.createAppointment")}>
          <button
            type="button"
            onClick={() => openAppointmentModal(patient)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={t("actions.createAppointment")}
          >
            <Plus size={16} />
          </button>
        </Tooltip>
        <Tooltip label={tCommon("actions.edit")}>
          <button
            type="button"
            onClick={() => openEditModal(patient)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-primary-blue/20 hover:bg-primary-blue/5 hover:text-primary-blue"
            aria-label={tCommon("actions.edit")}
          >
            <Pencil size={16} />
          </button>
        </Tooltip>
        <Tooltip label={tCommon("actions.delete")}>
          <button
            type="button"
            onClick={() => handleDelete(patient.id)}
            disabled={deleteMutation.isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            aria-label={tCommon("actions.delete")}
          >
            <Trash2 size={16} />
          </button>
        </Tooltip>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-navy sm:text-3xl">{t("list.title")}</h1>
          <p className="mt-1 text-text-light">{t("list.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue-dark"
        >
          <Plus size={18} />
          {t("list.addButton")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-color bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border-color px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-dark-navy">{t("list.sectionTitle")}</h2>
            <span className="rounded-full bg-primary-blue/10 px-3 py-1 text-sm font-medium text-primary-blue">
              {t("list.patientsCount", { count: totalPatients })}
            </span>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => handleTableSearchChange(e.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => handleTableSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <DentalLoader fullScreen={false} text={t("list.loading")} />
        ) : patientsError ? (
          <div className="p-6">
            <p className="text-red-600">{t("list.loadError")}</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => (
                  <div key={patient.id} className="flex flex-col gap-3 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-blue/10 font-bold text-primary-blue">
                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-dark-navy">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{getPatientPhone(patient)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGenderBadgeClass(patient.gender)}`}>
                        {getGenderLabel(patient.gender, t)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{t("table.birthDate")}: {patient.birthDate || "-"}</span>
                    </div>
                    {patient.anamnesis && (
                      <p className="truncate text-xs text-slate-500">
                        {t("table.anamnesis")}: {patient.anamnesis}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {renderPatientActionButtons(patient)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-500">
                  {tableSearch ? t("list.emptyNoResults") : t("list.emptyNoPatients")}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">{t("table.patient")}</th>
                    <th className="px-6 py-4">{t("table.phone")}</th>
                    <th className="px-6 py-4">{t("table.gender")}</th>
                    <th className="px-6 py-4">{t("table.birthDate")}</th>
                    <th className="px-6 py-4">{t("table.anamnesis")}</th>
                    <th className="px-6 py-4 text-right">{t("table.actionsHeader")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.length > 0 ? (
                    paginatedPatients.map((patient, idx) => (
                      <tr key={patient.id} data-entity-id={patient.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-blue/10 font-bold text-primary-blue">
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
                            {getGenderLabel(patient.gender, t)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{patient.birthDate}</td>
                        <td className="max-w-[220px] truncate px-6 py-4 text-slate-600">
                          {patient.anamnesis || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {renderPatientActionButtons(patient)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        {tableSearch
                          ? t("list.emptyNoResults")
                          : t("list.emptyNoPatients")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 border-t border-border-color px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
                {/* Left: counter */}
                <p className="text-sm text-text-light">
                  {t.rich("list.paginationSummary", {
                    from: (currentPage - 1) * PAGE_SIZE + 1,
                    to: Math.min(currentPage * PAGE_SIZE, totalPatients),
                    total: totalPatients,
                    b: (chunks) => <span className="font-semibold text-dark-navy">{chunks}</span>,
                  })}
                </p>

                {/* Right: pagination */}
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <Tooltip label={tCommon("actions.previous")}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label={tCommon("actions.previous")}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-primary-blue hover:text-primary-blue disabled:opacity-30"
                    >
                      <ChevronLeft size={15} />
                    </button>
                  </Tooltip>

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
                              ? "border-primary-blue bg-primary-blue text-white shadow-sm shadow-primary-blue/20"
                              : "border-border-color text-slate-500 hover:border-primary-blue hover:text-primary-blue"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                  <Tooltip label={tCommon("actions.next")}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label={tCommon("actions.next")}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-primary-blue hover:text-primary-blue disabled:opacity-30"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Phone Search Modal */}
      {modalState === "phone-search" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border-color px-4 py-4 sm:px-6">
              <h2 className="text-xl font-bold text-dark-navy">{t("phoneSearchModal.title")}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-72px)] space-y-4 overflow-y-auto p-4 sm:p-6">
              {phoneSearchResult ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="mt-0.5 flex-shrink-0 text-green-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">{t("phoneSearchModal.foundTitle")}</p>
                      <p className="mt-0.5 text-xs text-green-700">{t("phoneSearchModal.foundSubtitle")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Info label={t("info.name")} value={`${phoneSearchResult.firstName} ${phoneSearchResult.lastName}`} />
                    <Info label={t("info.phone")} value={getPatientPhone(phoneSearchResult)} />
                    <Info label={t("info.gender")} value={getGenderLabel(phoneSearchResult.gender, t)} />
                    <Info label={t("info.birthDate")} value={phoneSearchResult.birthDate} />
                    <Info label={t("info.anamnesis")} value={phoneSearchResult.anamnesis || "-"} />
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border-color pt-4">
                    {!isReceptionist && (
                      <button
                        type="button"
                        onClick={() => {
                          closeModal();
                          goToTreatment(phoneSearchResult);
                        }}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                      >
                        {t("actions.startTreatment")}
                      </button>
                    )}
                    <div className="flex gap-3">
                      <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                        {tCommon("actions.close")}
                      </button>
                      <button type="button" onClick={() => openAppointmentModal(phoneSearchResult)} className="flex-1 rounded-xl bg-primary-blue px-4 py-3 font-semibold text-white hover:bg-primary-blue-dark">
                        {t("actions.createAppointment")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePhoneSearch} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">{t("phoneSearchModal.phoneLabel")}</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneSearch}
                        onChange={(e) => handlePhoneSearchInput(e.target.value)}
                        placeholder={t("phoneSearchModal.phonePlaceholder")}
                        maxLength={13}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-lg font-semibold tracking-wider outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                      <Search className="absolute right-3 top-3.5 text-slate-400" size={18} />
                    </div>
                    <div className="mt-2 rounded-lg border border-primary-blue/20 bg-primary-blue/5 p-3">
                      <p className="text-xs text-slate-600">
                        {t.rich("phoneSearchModal.phonePreview", {
                          value: phoneSearch || t("phoneSearchModal.phonePlaceholder"),
                          b: (chunks) => <span className="font-semibold text-primary-blue">{chunks}</span>,
                        })}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{t("phoneSearchModal.phoneHelp")}</p>
                  </div>

                  {phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
                      <p className="text-sm text-red-700">{phoneSearchError}</p>
                    </div>
                  )}

                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <div className="flex items-start gap-3 rounded-xl border border-primary-blue/20 bg-primary-blue/5 p-4">
                      <AlertCircle className="mt-0.5 flex-shrink-0 text-primary-blue" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-dark-navy">{t("phoneSearchModal.notFoundTitle")}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{t("phoneSearchModal.notFoundSubtitle")}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-border-color pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                      {tCommon("actions.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={phoneSearchLoading || phoneDigits.length !== 12}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-blue px-4 py-3 font-semibold text-white hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {phoneSearchLoading ? (
                        <><DentalLoaderIcon size={16} className="text-white" /> {t("phoneSearchModal.searching")}</>
                      ) : (
                        <><Search size={16} /> {t("phoneSearchModal.searchButton")}</>
                      )}
                    </button>
                  </div>

                  {phoneSearchAttempted && !phoneSearchResult && !phoneSearchLoading && !phoneSearchError && (
                    <button
                      type="button"
                      onClick={proceedToCreateForm}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus size={16} /> {t("phoneSearchModal.createNewButton")}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border-color px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-dark-navy">{t("appointmentModal.title")}</h2>
                <p className="mt-1 break-words text-sm text-text-light">
                  {t("appointmentModal.subtitle", { name: `${selectedPatient.firstName} ${selectedPatient.lastName}` })}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="max-h-[calc(92vh-88px)] space-y-4 overflow-y-auto p-4 sm:p-6">
              <div className="rounded-xl border border-primary-blue/10 bg-primary-blue/5 p-4">
                <p className="text-xs font-medium uppercase text-primary-blue">{t("appointmentModal.patientLabel")}</p>
                <p className="mt-1 font-semibold text-dark-navy">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="mt-1 text-sm text-text-light">{getPatientPhone(selectedPatient)}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{t("appointmentModal.doctorLabel")}</label>
                <select
                  value={appointmentForm.doctorId}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">{t("appointmentModal.selectDoctorOption")}</option>
                  {appointmentDoctors.map((doctor: any) => {
                    const doctorId = getDoctorId(doctor);
                    return <option key={doctorId} value={doctorId}>{getDoctorName(doctor) || doctorId}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t("appointmentModal.dateLabel")}</label>
                  <DateInput
                    value={appointmentForm.appointmentDate}
                    onChange={(value) => setAppointmentForm((prev) => ({ ...prev, appointmentDate: value }))}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t("appointmentModal.startTimeLabel")}</label>
                  <TimeInput
                    value={appointmentForm.startTime}
                    onChange={(value) => setAppointmentForm((prev) => ({ ...prev, startTime: value }))}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{t("appointmentModal.slotDurationLabel")}</label>
                <select
                  value={appointmentForm.slotDurationMinutes}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value={15}>{t("appointmentModal.durationMinutes", { minutes: 15 })}</option>
                  <option value={30}>{t("appointmentModal.durationMinutes", { minutes: 30 })}</option>
                  <option value={45}>{t("appointmentModal.durationMinutes", { minutes: 45 })}</option>
                  <option value={60}>{t("appointmentModal.durationMinutes", { minutes: 60 })}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{t("appointmentModal.notesLabel")}</label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={t("appointmentModal.notesPlaceholder")}
                  className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border-color pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="w-full rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 sm:w-auto">
                  {tCommon("actions.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="w-full rounded-xl bg-primary-blue px-5 py-3 font-semibold text-white hover:bg-primary-blue-dark disabled:opacity-50 sm:w-auto"
                >
                  {createAppointmentMutation.isPending ? t("appointmentModal.creating") : t("actions.createAppointment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Patient Modal */}
      {modalState === "form" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border-color px-4 py-4 sm:px-6">
              <h2 className="text-xl font-bold text-dark-navy">
                {editingPatient ? t("form.editTitle") : t("form.createTitle")}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid max-h-[calc(92vh-88px)] grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6">
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder={t("form.firstNamePlaceholder")} required className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue" />
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder={t("form.lastNamePlaceholder")} required className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue" />
              <DateInput
                value={form.birthDate}
                onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value }))}
                max={todayYMDValue()}
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-primary-blue"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                placeholder={t("phoneSearchModal.phonePlaceholder")}
                maxLength={13}
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue"
              />
              <select name="gender" value={form.gender} onChange={handleChange} className={`rounded-xl border px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-primary-blue ${getGenderBadgeClass(form.gender)}`}>
                <option value={Gender.MALE}>{t("gender.male")}</option>
                <option value={Gender.FEMALE}>{t("gender.female")}</option>
              </select>
              <textarea name="anamnesis" value={form.anamnesis} onChange={handleChange} placeholder={t("form.anamnesisPlaceholder")} className="min-h-[110px] rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-blue sm:col-span-2" />

              <div className="flex flex-col-reverse gap-3 border-t border-border-color pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="w-full rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 sm:w-auto">
                  {tCommon("actions.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full rounded-xl bg-primary-blue px-5 py-3 font-semibold text-white hover:bg-primary-blue-dark disabled:opacity-50 sm:w-auto"
                >
                  {editingPatient ? t("form.saveChangesButton") : t("form.createButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Treatment Confirm Modal — patient yaratilgandan keyin chiqadi */}
      {modalState === "start-confirm" && pendingNewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Sparkles size={28} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-dark-navy">
                {t("startConfirm.title")}
              </h2>
              <p className="mt-2 text-sm text-text-light">
                {t.rich("startConfirm.message", {
                  name: `${pendingNewPatient.firstName} ${pendingNewPatient.lastName}`,
                  b: (chunks) => <span className="font-semibold text-dark-navy">{chunks}</span>,
                })}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                {t("startConfirm.no")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const patient = pendingNewPatient;
                  closeModal();
                  goToTreatment(patient);
                }}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                {t("startConfirm.yes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {modalState === "view" && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between px-4 pt-6 sm:px-6">
              <h2 className="text-2xl font-bold text-dark-navy">{t("viewModal.title")}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-180px)] space-y-4 overflow-y-auto px-4 py-5 text-sm sm:px-6">
              <Info label={t("info.name")} value={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />
              <Info label={t("info.phone")} value={getPatientPhone(selectedPatient)} />
              <Info label={t("info.gender")} value={getGenderLabel(selectedPatient.gender, t)} />
              <Info label={t("info.birthDate")} value={selectedPatient.birthDate} />
              <Info label={t("info.anamnesis")} value={selectedPatient.anamnesis || "-"} />
            </div>
            <div className="flex flex-col gap-3 border-t border-border-color px-4 py-4 sm:flex-row sm:px-6">
              <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                {tCommon("actions.close")}
              </button>
              {!isReceptionist && (
                <button type="button" onClick={() => goToTreatment(selectedPatient)} className="flex-1 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700">
                  {t("actions.startTreatment")}
                </button>
              )}
              <button type="button" onClick={() => openAppointmentModal(selectedPatient)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
                {t("actions.createAppointment")}
              </button>
              <button type="button" onClick={() => openEditModal(selectedPatient)} className="flex-1 rounded-xl bg-primary-blue px-4 py-3 font-semibold text-white hover:bg-primary-blue-dark">
                {t("actions.editPatient")}
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
      <p className="mt-1 break-words font-semibold text-dark-navy">{value}</p>
    </div>
  );
}
