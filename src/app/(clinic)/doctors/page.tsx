"use client";

/**
 * File: src/app/(dashboard)/doctors/page.tsx
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  useDeleteDoctor,
  useGetDoctors,
  useInviteDoctor,
  useUpdateDoctor,
} from "@/src/features/doctors/hooks/useDoctors";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { Role, UserStatus } from "@/src/lib/enums/enums.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { useAuthStore } from "@/src/store/auth.store";
import type {
  CompensationType,
  Doctor,
  DoctorStatus,
  StaffRole,
} from "@/src/types/doctor.types";

const staffRoleOptions: StaffRole[] = [
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.ASSISTANT,
];

const statusOptions: DoctorStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.BLOCKED,
  UserStatus.PENDING,
  UserStatus.DELETED,
];

const compensationTypeOptions: CompensationType[] = ["PERCENTAGE", "SALARY"];

// DOCTOR va ASSISTANT uchun compensation turi tanlanadi (PERCENTAGE yoki SALARY)
// RECEPTIONIST uchun faqat SALARY (tanlov ko'rsatilmaydi, avtomatik SALARY)
const rolesWithCompensationChoice: StaffRole[] = [Role.DOCTOR, Role.ASSISTANT];

const initialEditForm = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  avatarUrl: "",
  role: Role.DOCTOR as StaffRole,
  status: UserStatus.ACTIVE as DoctorStatus,
};

function getDoctorId(doctor: Doctor) {
  return doctor.id || doctor._id || "";
}

function getMainRole(doctor: Doctor): StaffRole {
  const role = doctor.roles?.find((item) =>
    staffRoleOptions.includes(item as StaffRole)
  );

  return (role as StaffRole) || Role.DOCTOR;
}

function getRoleBadgeClass(role: string) {
  if (role === Role.DOCTOR) return "bg-blue-100 text-blue-700";
  if (role === Role.RECEPTIONIST) return "bg-purple-100 text-purple-700";
  if (role === Role.ASSISTANT) return "bg-emerald-100 text-emerald-700";

  return "bg-slate-100 text-slate-600";
}

function getStatusBadgeClass(status?: string) {
  if (status === UserStatus.ACTIVE) return "bg-green-100 text-green-700";
  if (status === UserStatus.PENDING) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

// ─── Beautiful Dropdown ───────────────────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
  count?: number;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select",
  buttonClassName,
  menuClassName,
  align = "left",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          buttonClassName ??
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-4 focus:ring-blue-100"
        }
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={
            menuClassName ??
            `absolute top-full z-30 mt-2 max-h-72 w-full min-w-[200px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70 ${
              align === "right" ? "right-0" : "left-0"
            }`
          }
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  {typeof option.count === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isSelected
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {option.count}
                    </span>
                  )}
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  const toast = useToast();

  // Faqat SUPER_ADMIN / CLINIC_ADMIN — invite/edit/delete huquqiga ega.
  // Boshqa rollar (Receptionist, Assistant) ro'yxatni ko'radi, lekin
  // hech qanday boshqaruv tugmasini ko'rmaydi.
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isClinicAdmin = useAuthStore((s) => s.isClinicAdmin());
  const isStaffAdmin = isAdmin || isClinicAdmin;

  const tableColSpan = isStaffAdmin ? 6 : 5;

  /**
   * getDoctors() service da allaqachon isStaffUser filter qilingan.
   * Bu yerda qayta filter qilish shart emas — doctors to'g'ridan ishlatiladi.
   */
  const { data: doctors = [], isLoading, isError, refetch } = useGetDoctors();

  const inviteDoctorMutation = useInviteDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<DoctorStatus | "ALL">("ALL");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>(Role.DOCTOR);
  const [inviteCompensationType, setInviteCompensationType] =
    useState<CompensationType>("PERCENTAGE");
  const [inviteCommissionPercentage, setInviteCommissionPercentage] =
    useState("");
  const [inviteSalaryAmount, setInviteSalaryAmount] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const selectedDoctorId = selectedDoctor ? getDoctorId(selectedDoctor) : "";
  const updateDoctorMutation = useUpdateDoctor(selectedDoctorId);

  // DOCTOR/ASSISTANT -> compensation type tanlash ko'rsatiladi
  // RECEPTIONIST -> compensation type tanlanmaydi, doim SALARY
  const showsCompensationTypeChoice =
    rolesWithCompensationChoice.includes(inviteRole);
  const isReceptionistRole = inviteRole === Role.RECEPTIONIST;
  const showsCompensationFields =
    showsCompensationTypeChoice || isReceptionistRole;

  const effectiveCompensationType: CompensationType = isReceptionistRole
    ? "SALARY"
    : inviteCompensationType;

  /**
   * Har bir role/status uchun nechta staff borligini hisoblaymiz —
   * filter chiplarida son ko'rsatish uchun.
   */
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    doctors.forEach((doctor) => {
      doctor.roles?.forEach((role) => {
        counts.set(role, (counts.get(role) ?? 0) + 1);
      });
    });
    return counts;
  }, [doctors]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    doctors.forEach((doctor) => {
      const status = doctor.status || UserStatus.ACTIVE;
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    return counts;
  }, [doctors]);

  /**
   * Client-side search + role + status filter — service da allaqachon
   * staff filter bo'lgani uchun bu yerda faqat qo'shimcha filterlar.
   */
  const filteredDoctors = useMemo(() => {
    const value = search.toLowerCase().trim();

    return doctors.filter((doctor) => {
      if (roleFilter !== "ALL" && !doctor.roles?.includes(roleFilter)) {
        return false;
      }

      if (statusFilter !== "ALL" && doctor.status !== statusFilter) {
        return false;
      }

      if (!value) return true;

      const fullName =
        `${doctor.firstName || ""} ${doctor.lastName || ""}`.toLowerCase();
      const email = doctor.email?.toLowerCase() || "";
      const phone = (doctor.phoneNumber || doctor.phone || "").toLowerCase();
      const status = doctor.status?.toLowerCase() || "";
      const roles = doctor.roles?.join(" ").toLowerCase() || "";

      return (
        fullName.includes(value) ||
        email.includes(value) ||
        phone.includes(value) ||
        status.includes(value) ||
        roles.includes(value)
      );
    });
  }, [doctors, search, roleFilter, statusFilter]);

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  function handleOpenInviteModal() {
    setInviteEmail("");
    setInviteRole(Role.DOCTOR);
    setInviteCompensationType("PERCENTAGE");
    setInviteCommissionPercentage("");
    setInviteSalaryAmount("");
    setIsInviteModalOpen(true);
  }

  function handleCloseInviteModal() {
    setInviteEmail("");
    setInviteRole(Role.DOCTOR);
    setInviteCompensationType("PERCENTAGE");
    setInviteCommissionPercentage("");
    setInviteSalaryAmount("");
    setIsInviteModalOpen(false);
  }

  function handleInviteRoleChange(nextRole: StaffRole) {
    setInviteRole(nextRole);
    // Role almashganda eski compensation qiymatlari qolib ketmasin
    setInviteCompensationType("PERCENTAGE");
    setInviteCommissionPercentage("");
    setInviteSalaryAmount("");
  }

  function handleOpenEditModal(doctor: Doctor) {
    setSelectedDoctor(doctor);

    setEditForm({
      firstName: doctor.firstName || "",
      lastName: doctor.lastName || "",
      phoneNumber: doctor.phoneNumber || doctor.phone || "",
      avatarUrl: doctor.avatarUrl || "",
      role: getMainRole(doctor),
      status: doctor.status || UserStatus.ACTIVE,
    });
  }

  function handleCloseEditModal() {
    setSelectedDoctor(null);
    setEditForm(initialEditForm);
  }

  function handleResetFilters() {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleInviteDoctor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.warning("Email kiriting");
      return;
    }

    if (showsCompensationFields) {
      if (
        effectiveCompensationType === "PERCENTAGE" &&
        !inviteCommissionPercentage.trim()
      ) {
        toast.warning("Commission percentage kiriting");
        return;
      }

      if (
        effectiveCompensationType === "SALARY" &&
        !inviteSalaryAmount.trim()
      ) {
        toast.warning("Salary amount kiriting");
        return;
      }
    }

    try {
      await inviteDoctorMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
        ...(showsCompensationFields && {
          compensationType: effectiveCompensationType,
          ...(effectiveCompensationType === "PERCENTAGE"
            ? { commissionPercentage: Number(inviteCommissionPercentage) }
            : { salaryAmount: Number(inviteSalaryAmount) }),
        }),
      });

      handleCloseInviteModal();

      /**
       * refetch() kerak emas — useInviteDoctor onSuccess da
       * invalidateQueries chaqiradi, query avtomatik yangilanadi.
       */
      toast.success(`${inviteRole} uchun invite yuborildi`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invite yuborishda xatolik bo'ldi"));
    }
  }

  async function handleUpdateDoctor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedDoctorId) {
      toast.error("User ID topilmadi");
      return;
    }

    if (!editForm.firstName.trim()) {
      toast.warning("First name kiriting");
      return;
    }

    if (!editForm.lastName.trim()) {
      toast.warning("Last name kiriting");
      return;
    }

    try {
      await updateDoctorMutation.mutateAsync({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        avatarUrl: editForm.avatarUrl.trim(),
        roles: [editForm.role],
        status: editForm.status,
      });

      handleCloseEditModal();

      // refetch() kerak emas — useUpdateDoctor onSuccess da invalidateQueries bor
      toast.success("Staff updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Staff update qilishda xatolik bo'ldi"));
    }
  }

  async function handleDeleteDoctor(doctor: Doctor) {
    const doctorId = getDoctorId(doctor);

    if (!doctorId) {
      toast.error("User ID topilmadi");
      return;
    }

    const confirmed = confirm(
      `${doctor.firstName} ${doctor.lastName} ni o'chirmoqchimisiz?`
    );

    if (!confirmed) return;

    try {
      await deleteDoctorMutation.mutateAsync(doctorId);

      // refetch() kerak emas — useDeleteDoctor onSuccess da invalidateQueries bor
      toast.success("Staff deleted successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Staff delete qilishda xatolik bo'ldi"));
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasActiveFilters =
    Boolean(search.trim()) || roleFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic Staff</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage doctors, receptionists, assistants and clinic team invites.
          </p>
        </div>

        {isStaffAdmin && (
          <button
            type="button"
            onClick={handleOpenInviteModal}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
          >
            + Add Staff
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Staff List</h2>
            </div>
          </div>

          {/* Role va Status filterlar */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-56">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
              </label>
              <Dropdown
                value={roleFilter}
                onChange={(v) => setRoleFilter(v as StaffRole | "ALL")}
                options={[
                  { value: "ALL", label: "Barcha rollar", count: doctors.length },
                  ...staffRoleOptions.map((role) => ({
                    value: role,
                    label: role,
                    count: roleCounts.get(role) ?? 0,
                  })),
                ]}
              />
            </div>

            <div className="w-full sm:w-56">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </label>
              <Dropdown
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as DoctorStatus | "ALL")}
                options={[
                  { value: "ALL", label: "Barcha statuslar", count: doctors.length },
                  ...statusOptions.map((status) => ({
                    value: status,
                    label: status,
                    count: statusCounts.get(status) ?? 0,
                  })),
                ]}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Filterlarni tozalash
              </button>
            )}
            <div className="w-full md:ml-auto md:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-600">
              Staff listni olishda xatolik bo'ldi.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Staff
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  {isStaffAdmin && (
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={tableColSpan}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColSpan}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      {hasActiveFilters
                        ? "Filterga mos staff topilmadi"
                        : "No staff found"}
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr
                      key={getDoctorId(doctor)}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {doctor.avatarUrl ? (
                            <img
                              src={doctor.avatarUrl}
                              alt={`${doctor.firstName} ${doctor.lastName}`}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-700">
                              {doctor.firstName?.[0]}
                              {doctor.lastName?.[0]}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-900">
                              {doctor.firstName} {doctor.lastName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.email || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.phoneNumber || doctor.phone || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {doctor.roles?.length ? (
                            doctor.roles.map((role) => (
                              <span
                                key={role}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(role)}`}
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(doctor.status)}`}
                        >
                          {doctor.status}
                        </span>
                      </td>

                      {isStaffAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(doctor)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDoctor(doctor)}
                              disabled={deleteDoctorMutation.isPending}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal — faqat isStaffAdmin bo'lsa ochilishi mumkin (tugma yashirin) */}
      {isInviteModalOpen && isStaffAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Staff</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select role and send invite link to email.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseInviteModal}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleInviteDoctor} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role
                </label>

                <Dropdown
                  value={inviteRole}
                  onChange={(v) => handleInviteRoleChange(v as StaffRole)}
                  buttonClassName="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  options={staffRoleOptions.map((role) => ({
                    value: role,
                    label: role,
                  }))}
                />
              </div>

              {showsCompensationFields && (
                <>
                  {showsCompensationTypeChoice && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Compensation Type
                      </label>

                      <Dropdown
                        value={inviteCompensationType}
                        onChange={(v) =>
                          setInviteCompensationType(v as CompensationType)
                        }
                        buttonClassName="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        options={compensationTypeOptions.map((type) => ({
                          value: type,
                          label: type === "PERCENTAGE" ? "Percentage" : "Salary",
                        }))}
                      />
                    </div>
                  )}

                  {effectiveCompensationType === "PERCENTAGE" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Commission Percentage
                      </label>

                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={inviteCommissionPercentage}
                        onChange={(e) =>
                          setInviteCommissionPercentage(e.target.value)
                        }
                        placeholder="40"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Salary Amount
                      </label>

                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={inviteSalaryAmount}
                        onChange={(e) => setInviteSalaryAmount(e.target.value)}
                        placeholder="5000000"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                User emaildagi linkni bosadi, keyin name va password kiritib
                signup qiladi.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={inviteDoctorMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inviteDoctorMutation.isPending ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal — faqat isStaffAdmin bo'lsa ochilishi mumkin (Edit tugmasi yashirin) */}
      {selectedDoctor && isStaffAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Staff</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update staff profile and role.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phoneNumber: e.target.value })
                  }
                  placeholder="+998901112233"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Avatar URL
                </label>

                <input
                  type="text"
                  value={editForm.avatarUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, avatarUrl: e.target.value })
                  }
                  placeholder="https://cdn.example.com/avatar.png"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role
                </label>

                <Dropdown
                  value={editForm.role}
                  onChange={(v) =>
                    setEditForm({ ...editForm, role: v as StaffRole })
                  }
                  buttonClassName="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  options={staffRoleOptions.map((role) => ({
                    value: role,
                    label: role,
                  }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <Dropdown
                  value={editForm.status}
                  onChange={(v) =>
                    setEditForm({ ...editForm, status: v as DoctorStatus })
                  }
                  buttonClassName="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  options={statusOptions.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateDoctorMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateDoctorMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}