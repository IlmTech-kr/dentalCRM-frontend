"use client";

import { Camera, Mail, Phone, Save, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getMe, updateMe } from "@/src/features/auth/user.service";
import type { UserProfile } from "@/src/types/user.types";

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<UserProfile>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatarUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await getMe();

      setProfile({
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to load profile. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await updateMe({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        avatarUrl: profile.avatarUrl,
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
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

    setProfile({
      ...profile,
      avatarUrl: url,
    });
    
    setError("");
  }

  const firstLetter =
    profile.firstName?.[0]?.toUpperCase() ||
    profile.email?.[0]?.toUpperCase() ||
    "U";

  if (loading) {
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
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-5 rounded-2xl bg-green-50 p-4 text-green-600 flex items-center gap-3 border border-green-200">
              <div className="text-lg">✓</div>
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600 flex items-center gap-3 border border-red-200">
              <div className="text-lg">✕</div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={saveProfile} className="grid gap-5 md:grid-cols-2">
            <ProfileInput
              label="First Name"
              icon={<User size={18} />}
              value={profile.firstName}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  firstName: value,
                })
              }
            />

            <ProfileInput
              label="Last Name"
              icon={<User size={18} />}
              value={profile.lastName}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  lastName: value,
                })
              }
            />

            <ProfileInput
              label="Phone"
              icon={<Phone size={18} />}
              value={profile.phoneNumber || ""}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  phoneNumber: value,
                })
              }
            />

            <ProfileInput
              label="Email"
              icon={<Mail size={18} />}
              value={profile.email}
              disabled
              onChange={() => {}}
            />

            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-primary-blue px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Profile"}
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