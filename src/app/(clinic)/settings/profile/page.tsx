"use client";

/**
 * File: src/app/(clinic)/settings/profile/page.tsx
 */

import { Camera, Mail, Phone, Save, User, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { UserProfile } from "@/src/types/user.types";
import { useGetProfile, useUpdateProfile } from "@/src/features/users/hooks/useUser";
import { useToast } from "@/src/lib/hooks/Usetoast";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "U";
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 animate-pulse bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <div className="flex items-center gap-6 px-8 py-7">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileInput
// ---------------------------------------------------------------------------

function ProfileInput({
  label,
  icon,
  value,
  onChange,
  disabled = false,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className={`flex h-12 items-center gap-3 rounded-2xl border-2 px-4 transition-all ${
        disabled
          ? "border-slate-100 bg-slate-50"
          : "border-slate-200 bg-white focus-within:border-blue-400 hover:border-slate-300"
      }`}>
        <span className="shrink-0 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={disabled ? "—" : `Enter ${label.toLowerCase()}`}
          disabled={disabled}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { data: profileData, isLoading, error: loadError } = useGetProfile();
  const updateMutation = useUpdateProfile();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatarUrl: "",
  });

  /**
   * profileData kelganda form ni bir marta to'ldirish.
   * toast dependency loop xavfidan qochish uchun
   * loadError ni ref bilan emas, to'g'ridan tekshiramiz.
   */
  useEffect(() => {
    if (profileData) {
      setForm({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phoneNumber: profileData.phoneNumber || "",
        avatarUrl: profileData.avatarUrl || "",
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (loadError) {
      toast.error(
        loadError instanceof Error ? loadError.message : "Failed to load profile"
      );
    }
    // toast useMemo bilan stable — loop xavfi yo'q
  }, [loadError]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Image size must be less than 5MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarUrl: url }));
    toast.info("Image selected — click Save to apply");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        avatarUrl: form.avatarUrl,
      });

      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  }

  if (isLoading) return <ProfileSkeleton />;

  const initials = getInitials(form.firstName, form.lastName, profileData?.email);
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center gap-6 px-8 py-7">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600 ring-4 ring-white shadow-md">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
              title="Change photo"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} hidden type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-900">{displayName}</h1>
            <p className="mt-0.5 truncate text-sm text-slate-500">{profileData?.email}</p>
            {profileData?.roles?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profileData.roles.map((role) => (
                  <span key={role} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {formatRole(role)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileInput
              label="First Name"
              icon={<User size={16} />}
              value={form.firstName}
              onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))}
              disabled={updateMutation.isPending}
            />
            <ProfileInput
              label="Last Name"
              icon={<User size={16} />}
              value={form.lastName}
              onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))}
              disabled={updateMutation.isPending}
            />
          </div>

          <ProfileInput
            label="Phone"
            icon={<Phone size={16} />}
            value={form.phoneNumber}
            onChange={(v) => setForm((prev) => ({ ...prev, phoneNumber: v }))}
            type="tel"
            disabled={updateMutation.isPending}
          />

          {/* Email — read only */}
          <ProfileInput
            label="Email"
            icon={<Mail size={16} />}
            value={profileData?.email || ""}
            disabled
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <><Save size={16} />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}