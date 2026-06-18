"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  useDeleteDoctor,
  useGetDoctors,
  useInviteDoctor,
  useUpdateDoctor,
} from "@/src/features/doctors/hooks/useDoctors";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { Role, UserStatus } from "@/src/lib/enums/enums.types";
import { useToast } from "@/src/lib/hooks/Usetoast";
import type { Doctor, DoctorStatus, StaffRole } from "@/src/types/doctor.types";

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
    staffRoleOptions.includes(item as StaffRole),
  );

  return (role as StaffRole) || Role.DOCTOR;
}

function getRoleBadgeClass(role: string) {
  if (role === Role.DOCTOR) return "bg-blue-100 text-blue-700";
  if (role === Role.RECEPTIONIST) return "bg-purple-100 text-purple-700";
  if (role === Role.ASSISTANT) return "bg-emerald-100 text-emerald-700";

  return "bg-slate-100 text-slate-600";
}

export default function DoctorsPage() {
  const toast = useToast();

  const { data: doctors = [], isLoading, isError, refetch } = useGetDoctors();

  const inviteDoctorMutation = useInviteDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  const [search, setSearch] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>(Role.DOCTOR);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const selectedDoctorId = selectedDoctor ? getDoctorId(selectedDoctor) : "";
  const updateDoctorMutation = useUpdateDoctor(selectedDoctorId);

  const staffUsers = useMemo(() => {
    return doctors.filter((doctor) =>
      doctor.roles?.some((role) =>
        staffRoleOptions.includes(role as StaffRole),
      ),
    );
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return staffUsers;

    return staffUsers.filter((doctor) => {
      const fullName = `${doctor.firstName || ""} ${
        doctor.lastName || ""
      }`.toLowerCase();

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
  }, [staffUsers, search]);

  function handleOpenInviteModal() {
    setInviteEmail("");
    setInviteRole(Role.DOCTOR);
    setIsInviteModalOpen(true);
  }

  function handleCloseInviteModal() {
    setInviteEmail("");
    setInviteRole(Role.DOCTOR);
    setIsInviteModalOpen(false);
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

  async function handleInviteDoctor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.warning("Email kiriting");
      return;
    }

    try {
      await inviteDoctorMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      handleCloseInviteModal();
      await refetch();

      toast.success(`${inviteRole} uchun invite yuborildi`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invite yuborishda xatolik bo‘ldi"));
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
      await refetch();

      toast.success("Staff updated successfully");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Staff update qilishda xatolik bo‘ldi"),
      );
    }
  }

  async function handleDeleteDoctor(doctor: Doctor) {
    const doctorId = getDoctorId(doctor);

    if (!doctorId) {
      toast.error("User ID topilmadi");
      return;
    }

    const confirmed = confirm(
      `${doctor.firstName} ${doctor.lastName} ni o‘chirmoqchimisiz?`,
    );

    if (!confirmed) return;

    try {
      await deleteDoctorMutation.mutateAsync(doctorId);
      await refetch();

      toast.success("Staff deleted successfully");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Staff delete qilishda xatolik bo‘ldi"),
      );
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic Staff</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage doctors, receptionists, assistants and clinic team invites.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenInviteModal}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
        >
          + Add Staff
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Staff List
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All clinic users with DOCTOR, RECEPTIONIST and ASSISTANT roles.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-600">
              Staff listni olishda xatolik bo‘ldi.
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
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No staff found
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
                            <p className="text-xs text-slate-500">
                              ID: {getDoctorId(doctor)}
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
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                                  role,
                                )}`}
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            doctor.status === UserStatus.ACTIVE
                              ? "bg-green-100 text-green-700"
                              : doctor.status === UserStatus.PENDING
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>

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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Staff
                </h2>
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

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {staffRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

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

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Staff
                </h2>
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
                      setEditForm({
                        ...editForm,
                        firstName: e.target.value,
                      })
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
                      setEditForm({
                        ...editForm,
                        lastName: e.target.value,
                      })
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
                    setEditForm({
                      ...editForm,
                      phoneNumber: e.target.value,
                    })
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
                    setEditForm({
                      ...editForm,
                      avatarUrl: e.target.value,
                    })
                  }
                  placeholder="https://cdn.example.com/avatar.png"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role
                </label>

                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as StaffRole,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {staffRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as DoctorStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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
                  {updateDoctorMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}