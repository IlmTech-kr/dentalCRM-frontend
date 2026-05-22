"use client";

import { useMemo, useState } from "react";
import {
  useDeleteDoctor,
  useGetDoctors,
  useInviteDoctor,
  useUpdateDoctor,
} from "@/src/features/doctors/hooks/useDoctors";
import type { Doctor, DoctorStatus } from "@/src/types/doctor.types";
import { useToast } from "@/src/lib/hooks/Usetoast";

export default function DoctorsPage() {
  const { data: doctors = [], isLoading, isError, refetch } = useGetDoctors();

  const inviteDoctorMutation = useInviteDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatarUrl: "",
    status: "ACTIVE" as DoctorStatus,
  });

  const updateDoctorMutation = useUpdateDoctor(selectedDoctor?.id || "");
  const toast = useToast();

  const filteredDoctors = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return doctors;

    return doctors.filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const email = doctor.email?.toLowerCase() || "";
      const phone = doctor.phoneNumber?.toLowerCase() || "";

      return (
        fullName.includes(value) ||
        email.includes(value) ||
        phone.includes(value)
      );
    });
  }, [doctors, search]);

  function handleOpenEdit(doctor: Doctor) {
    setSelectedDoctor(doctor);

    setEditForm({
      firstName: doctor.firstName || "",
      lastName: doctor.lastName || "",
      phoneNumber: doctor.phoneNumber || "",
      avatarUrl: doctor.avatarUrl || "",
      status: doctor.status || "ACTIVE",
    });
  }

  function handleCloseEdit() {
    setSelectedDoctor(null);

    setEditForm({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      avatarUrl: "",
      status: "ACTIVE",
    });
  }

  function handleOpenInviteModal() {
    setInviteEmail("");
    setIsInviteModalOpen(true);
  }

  function handleCloseInviteModal() {
    setInviteEmail("");
    setIsInviteModalOpen(false);
  }

async function handleInviteDoctor(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!inviteEmail.trim()) {
    toast.warning("Doctor email kiriting");
    return;
  }

  try {
    await inviteDoctorMutation.mutateAsync({
      email: inviteEmail.trim(),
      role: "DOCTOR",
    });

    handleCloseInviteModal();
    await refetch();

    toast.success("Invite yuborildi. Doctor emaildagi link orqali signup qiladi.");
  } catch (error: any) {
    const message =
      error?.message || "Invite yuborishda xatolik bo‘ldi yoki bu email oldin ishlatilgan";

    toast.error(message);
  }
}

  async function handleUpdateDoctor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedDoctor?.id) {
      alert("Doctor ID topilmadi");
      return;
    }

    try {
      await updateDoctorMutation.mutateAsync({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        avatarUrl: editForm.avatarUrl,
        roles: ["DOCTOR"],
        status: editForm.status,
      });

      handleCloseEdit();
      alert("Doctor updated successfully");
    } catch (error) {
      console.error(error);
      alert("Doctor update qilishda xatolik bo‘ldi");
    }
  }

  async function handleDeleteDoctor(doctor: Doctor) {
    if (!doctor.id) {
      alert("Doctor ID topilmadi");
      return;
    }

    const confirmed = confirm(
      `${doctor.firstName} ${doctor.lastName} ni o‘chirmoqchimisiz?`
    );

    if (!confirmed) return;

    try {
      await deleteDoctorMutation.mutateAsync(doctor.id);
      alert("Doctor deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Doctor delete qilishda xatolik bo‘ldi");
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage clinic doctors, send invites, update profiles, and remove
            doctors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenInviteModal}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
        >
          + Add Doctor
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Doctors List
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All doctors from clinic users.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-600">
              Doctors listni olishda xatolik bo‘ldi.
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
                    Doctor
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
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
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      Loading doctors...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No doctors found
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
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
                              {doctor.roles?.join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.email || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.phoneNumber || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            doctor.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : doctor.status === "INACTIVE"
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
                            onClick={() => handleOpenEdit(doctor)}
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
                  Add Doctor
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Doctor emailiga invite link yuboriladi.
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
                  Doctor Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="doctor@gmail.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                Doctor emaildagi linkni bosadi, keyin name va password kiritib
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
                  Edit Doctor
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update doctor profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
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
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
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