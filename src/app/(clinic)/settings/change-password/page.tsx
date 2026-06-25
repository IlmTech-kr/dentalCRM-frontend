"use client";

/**
 * File: src/app/(clinic)/settings/change-password/page.tsx
 */

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useChangePassword } from "@/src/features/users/hooks/useUser";
import { useToast } from "@/src/lib/hooks/Usetoast";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type PasswordField = keyof PasswordForm;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  barColor: string;
  width: string;
} {
  if (!password) return { score: 0, label: "", color: "", barColor: "", width: "w-0" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "text-red-500", barColor: "bg-red-400", width: "w-1/5" };
  if (score <= 2) return { score, label: "Fair", color: "text-orange-500", barColor: "bg-orange-400", width: "w-2/5" };
  if (score <= 3) return { score, label: "Good", color: "text-yellow-600", barColor: "bg-yellow-400", width: "w-3/5" };
  if (score <= 4) return { score, label: "Strong", color: "text-blue-600", barColor: "bg-blue-500", width: "w-4/5" };
  return { score, label: "Very strong", color: "text-emerald-600", barColor: "bg-emerald-500", width: "w-full" };
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors ${met ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
        {met ? "✓" : "·"}
      </div>
      <span className={`text-xs transition-colors ${met ? "font-medium text-slate-700" : "text-slate-400"}`}>{text}</span>
    </div>
  );
}

function PasswordField({
  label,
  value,
  show,
  onToggle,
  onChange,
  error,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className={`flex h-12 items-center gap-3 rounded-2xl border-2 px-4 transition-all ${
        error
          ? "border-red-300 bg-red-50"
          : value
            ? "border-blue-300 bg-blue-50/40"
            : "border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white"
      }`}>
        <Lock size={16} className={error ? "text-red-400" : value ? "text-blue-400" : "text-slate-400"} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <button type="button" onClick={onToggle} disabled={disabled} className="shrink-0 text-slate-400 transition hover:text-slate-600 disabled:opacity-50">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const toast = useToast();
  const changePasswordMutation = useChangePassword();

  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState<PasswordForm>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});

  const strength = getPasswordStrength(form.newPassword);

  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  function update(field: PasswordField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    changePasswordMutation.reset();
  }

  function validate(): boolean {
    const next: Partial<Record<PasswordField, string>> = {};

    if (!form.currentPassword) next.currentPassword = "Current password is required";
    if (!form.newPassword) next.newPassword = "New password is required";
    else if (form.newPassword.length < 8) next.newPassword = "At least 8 characters required";
    else if (form.currentPassword && form.currentPassword === form.newPassword)
      next.newPassword = "New password must differ from current";
    if (!form.confirmPassword) next.confirmPassword = "Please confirm your new password";
    else if (form.newPassword !== form.confirmPassword) next.confirmPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    } catch {
      toast.error(
        changePasswordMutation.error instanceof Error
          ? changePasswordMutation.error.message
          : "Current password is incorrect"
      );
    }
  }

  const canSubmit = form.currentPassword && form.newPassword && form.confirmPassword && !changePasswordMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center gap-5 px-8 py-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Change Password</h1>
            <p className="mt-0.5 text-sm text-slate-500">Keep your account secure with a strong password</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="Current Password"
            value={form.currentPassword}
            show={show.current}
            onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
            onChange={(v) => update("currentPassword", v)}
            error={errors.currentPassword}
            placeholder="Enter your current password"
            disabled={changePasswordMutation.isPending}
          />

          <div className="space-y-3">
            <PasswordField
              label="New Password"
              value={form.newPassword}
              show={show.new}
              onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}
              onChange={(v) => update("newPassword", v)}
              error={errors.newPassword}
              placeholder="Create a strong password"
              disabled={changePasswordMutation.isPending}
            />

            {/* Strength meter */}
            {form.newPassword && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Password strength</span>
                  <span className={`text-xs font-black ${strength.color}`}>{strength.label}</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength.barColor} ${strength.width}`} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Requirement met={form.newPassword.length >= 8} text="8+ characters" />
                  <Requirement met={/[A-Z]/.test(form.newPassword)} text="Uppercase letter" />
                  <Requirement met={/\d/.test(form.newPassword)} text="Number" />
                  <Requirement met={/[!@#$%^&*]/.test(form.newPassword)} text="Special character" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <PasswordField
              label="Confirm New Password"
              value={form.confirmPassword}
              show={show.confirm}
              onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              onChange={(v) => update("confirmPassword", v)}
              error={errors.confirmPassword}
              placeholder="Re-enter your new password"
              disabled={changePasswordMutation.isPending}
            />
            {passwordsMatch && !errors.confirmPassword && (
              <p className="text-xs font-semibold text-emerald-600">✓ Passwords match</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security tip */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm text-blue-700">
          <span className="font-bold">Tip:</span> Use a unique password you don't use on other sites. A password manager can help.
        </p>
      </div>
    </div>
  );
}