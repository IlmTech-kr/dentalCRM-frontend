"use client";

import { Camera, Mail, Phone, Save, User } from "lucide-react";
import { useRef, useState } from "react";
import React from "react";

// ✅ IMPORT REACT QUERY HOOKS - CORRECT PATH
import {
  useGetProfile,
  useUpdateProfile,
} from "@/src/features/users/hooks/useUser";

import type { UserProfile } from "@/src/types/user.types";

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  // ✅ USE REACT QUERY HOOKS
  const { data: profileData, isLoading, error: loadError } = useGetProfile();
  const updateMutation = useUpdateProfile();

  // ✅ Initialize with all UserProfile fields
  const [profile, setProfile] = useState<UserProfile>({
    id: profileData?.id || "",
    email: profileData?.email || "",
    firstName: profileData?.firstName || "",
    lastName: profileData?.lastName || "",
    phoneNumber: profileData?.phoneNumber || "",
    avatarUrl: profileData?.avatarUrl || "",
    status: profileData?.status || "ACTIVE",
    roles: profileData?.roles || [],
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ✅ Sync profile data when loaded - includes all fields
  React.useEffect(() => {
    if (profileData) {
      setProfile({
        id: profileData.id || "",
        email: profileData.email || "",
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phoneNumber: profileData.phoneNumber || "",
        avatarUrl: profileData.avatarUrl || "",
        status: profileData.status || "ACTIVE",
        roles: profileData.roles || [],
      });
    }
  }, [profileData]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      // ✅ USE MUTATION - only send editable fields
      await updateMutation.mutateAsync({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        avatarUrl: profile.avatarUrl,
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      // ✅ ERROR HANDLED BY MUTATION
    }
  }

  function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const url = URL.createObjectURL(file);

    // ✅ Use functional update to preserve all fields
    setProfile((prev) => ({
      ...prev,
      avatarUrl: url,
    }));

    setError("");
  }

  const firstLetter =
    profile.firstName?.[0]?.toUpperCase() ||
    profile.email?.[0]?.toUpperCase() ||
    "U";

  // ✅ USE QUERY LOADING STATE
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white shadow-sm">
          <div className="h-36 bg-gradient-to-r from-primary-blue via-blue-500 to-cyan-500 animate-pulse" />
          <div className="px-8 pb-8">
            <div className="h-32 w-32 -mt-16 mb-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {/* Header Background */}
        <div className="h-36 bg-gradient-to-r from-primary-blue via-blue-500 to-cyan-500" />

        <div className="px-8 pb-8">
          {/* Avatar and Info Section */}
          <div className="-mt-16 mb-8 flex items-end gap-6">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-md">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-primary-blue">
                    {firstLetter}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-1 rounded-full bg-primary-blue p-3 text-white hover:bg-blue-700 transition-colors shadow-lg"
                title="Upload profile picture"
              >
                <Camera size={18} />
              </button>

              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={uploadImage}
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-dark-navy">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-text-light">{profile.email}</p>
              {profile.roles && profile.roles.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {profile.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                    >
                      {formatRole(role)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-5 rounded-2xl bg-green-50 p-4 text-green-600 flex items-center gap-3 border border-green-200">
              <div className="text-lg">✓</div>
              {message}
            </div>
          )}

          {/* ✅ ERROR MESSAGE FROM MUTATION OR QUERY */}
          {(error || updateMutation.error || loadError) && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600 flex items-center gap-3 border border-red-200">
              <div className="text-lg">✕</div>
              {error ||
                (updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : "Failed to update profile") ||
                (loadError instanceof Error
                  ? loadError.message
                  : "Failed to load profile")}
            </div>
          )}

          {/* Form */}
          <form onSubmit={saveProfile} className="grid gap-5 md:grid-cols-2">
            <ProfileInput
              label="First Name"
              icon={<User size={18} />}
              value={profile.firstName}
              onChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  firstName: value,
                }))
              }
              disabled={updateMutation.isPending}
            />

            <ProfileInput
              label="Last Name"
              icon={<User size={18} />}
              value={profile.lastName}
              onChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  lastName: value,
                }))
              }
              disabled={updateMutation.isPending}
            />

            <ProfileInput
              label="Phone"
              icon={<Phone size={18} />}
              value={profile.phoneNumber || ""}
              onChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  phoneNumber: value,
                }))
              }
              disabled={updateMutation.isPending}
            />

            <ProfileInput
              label="Email"
              icon={<Mail size={18} />}
              value={profile.email}
              disabled
              onChange={() => {}}
            />

            {/* ✅ SUBMIT BUTTON WITH MUTATION STATE */}
            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-2xl bg-primary-blue px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ProfileInputProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ProfileInput({
  label,
  icon,
  value,
  onChange,
  disabled = false,
}: ProfileInputProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-slate-700">{label}</label>

      <div
        className={`flex items-center gap-3 rounded-2xl border border-border-color p-4 transition-colors ${
          disabled
            ? "bg-slate-100 cursor-not-allowed"
            : "bg-white hover:border-primary-blue focus-within:border-primary-blue"
        }`}
      >
        <span className="text-slate-400 flex-shrink-0">{icon}</span>

        <input
          type={label === "Phone" ? "tel" : "text"}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full bg-transparent outline-none disabled:cursor-not-allowed disabled:text-slate-500"
        />
      </div>
    </div>
  );
}

/**
 * Format role name for display
 * SUPER_ADMIN → Super Admin
 * CLINIC_ADMIN → Clinic Admin
 */
function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}