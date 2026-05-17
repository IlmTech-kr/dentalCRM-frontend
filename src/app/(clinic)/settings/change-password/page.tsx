"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Save, CheckCircle, AlertCircle } from "lucide-react";
import { changePassword } from "@/src/features/auth/user.service";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationError {
  field: keyof PasswordForm;
  message: string;
}

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Password strength checker
  function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;
    
    if (!password) return { score: 0, label: "", color: "" };
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 1) return { score, label: "Weak", color: "text-red-600" };
    if (score <= 3) return { score, label: "Fair", color: "text-yellow-600" };
    if (score <= 4) return { score, label: "Good", color: "text-blue-600" };
    return { score, label: "Strong", color: "text-green-600" };
  }

  function validateForm(): boolean {
    const errors: ValidationError[] = [];

    if (!form.currentPassword) {
      errors.push({ field: "currentPassword", message: "Current password is required" });
    }

    if (!form.newPassword) {
      errors.push({ field: "newPassword", message: "New password is required" });
    } else if (form.newPassword.length < 8) {
      errors.push({ field: "newPassword", message: "Password must be at least 8 characters" });
    }

    if (!form.confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Please confirm your new password" });
    } else if (form.newPassword !== form.confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    if (form.currentPassword === form.newPassword) {
      errors.push({ field: "newPassword", message: "New password must be different from current password" });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage("Password changed successfully! 🎉");

      // Reset form
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 4 seconds
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = getPasswordStrength(form.newPassword);
  const isPasswordMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  const getFieldError = (field: keyof PasswordForm) => 
    validationErrors.find(e => e.field === field)?.message;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {/* Header Background */}
        <div className="h-36 bg-gradient-to-r from-primary-blue via-blue-500 to-cyan-500" />

        <div className="px-8 pb-8">
          {/* Icon and Title Section */}
          <div className="-mt-16 mb-8 flex items-end gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 shadow-md">
              <Lock size={56} className="text-primary-blue" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-dark-navy">
                Change Password
              </h1>
              <p className="text-text-light mt-1">
                Update your account password securely
              </p>
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 rounded-2xl bg-green-50 p-4 flex items-start gap-4 border border-green-200 animate-in slide-in-from-top">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 flex items-start gap-4 border border-red-200 animate-in slide-in-from-top">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <PasswordInput
              label="Current Password"
              value={form.currentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((prev) => !prev)}
              onChange={(value) => {
                setForm({ ...form, currentPassword: value });
                setValidationErrors(validationErrors.filter(e => e.field !== "currentPassword"));
              }}
              error={getFieldError("currentPassword")}
              placeholder="Enter your current password"
            />

            {/* New Password with Strength Indicator */}
            <div>
              <PasswordInput
                label="New Password"
                value={form.newPassword}
                show={showNew}
                onToggle={() => setShowNew((prev) => !prev)}
                onChange={(value) => {
                  setForm({ ...form, newPassword: value });
                  setValidationErrors(validationErrors.filter(e => e.field !== "newPassword"));
                }}
                error={getFieldError("newPassword")}
                placeholder="Create a strong password"
              />

              {/* Password Strength Meter */}
              {form.newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Password Strength
                    </span>
                    <span className={`text-xs font-bold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Strength Bar */}
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 1 ? "w-1/5 bg-red-500" :
                        passwordStrength.score <= 3 ? "w-2/5 bg-yellow-500" :
                        passwordStrength.score <= 4 ? "w-3/5 bg-blue-500" :
                        "w-full bg-green-500"
                      }`}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Requirement 
                      met={form.newPassword.length >= 8}
                      text="At least 8 characters"
                    />
                    <Requirement 
                      met={/[a-z]/.test(form.newPassword) && /[A-Z]/.test(form.newPassword)}
                      text="Uppercase & lowercase"
                    />
                    <Requirement 
                      met={/\d/.test(form.newPassword)}
                      text="At least one number"
                    />
                    <Requirement 
                      met={/[!@#$%^&*]/.test(form.newPassword)}
                      text="Special character"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              value={form.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
              onChange={(value) => {
                setForm({ ...form, confirmPassword: value });
                setValidationErrors(validationErrors.filter(e => e.field !== "confirmPassword"));
              }}
              error={getFieldError("confirmPassword")}
              placeholder="Re-enter your new password"
            />

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-blue font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-8 p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">🔒 Security Tip:</span> Use a strong, unique password that you don't use on other websites.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Requirement({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-xs font-bold transition-colors ${
          met
            ? "bg-green-100 text-green-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {met ? "✓" : "○"}
      </div>
      <span className={`text-xs ${met ? "text-slate-700 font-medium" : "text-slate-500"}`}>
        {text}
      </span>
    </div>
  );
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  placeholder?: string;
  success?: boolean;
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder,
  success,
}: PasswordInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div
        className={`flex h-12 items-center gap-3 rounded-2xl border px-4 transition-all ${
          error
            ? "border-red-200 bg-red-50"
            : success
            ? "border-green-200 bg-green-50"
            : "border-border-color bg-slate-50 hover:border-primary-blue focus-within:border-primary-blue"
        }`}
      >
        <Lock size={18} className={`flex-shrink-0 ${
          error
            ? "text-red-600"
            : success
            ? "text-green-600"
            : "text-slate-400"
        }`} />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Enter password"}
          className="w-full bg-transparent outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={onToggle}
          className={`flex-shrink-0 transition-colors ${
            error
              ? "text-red-600 hover:text-red-700"
              : success
              ? "text-green-600 hover:text-green-700"
              : "text-slate-400 hover:text-primary-blue"
          }`}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
          <span>✕</span> {error}
        </p>
      )}

      {/* Success Message */}
      {success && (
        <p className="mt-2 text-xs font-semibold text-green-600 flex items-center gap-1">
          <span>✓</span> Passwords match
        </p>
      )}
    </div>
  );
}