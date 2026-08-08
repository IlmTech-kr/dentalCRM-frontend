"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { useChangePassword } from "@/src/features/users/hooks/useUser";
import { useToast } from "@/src/lib/hooks/Usetoast";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type PasswordField = keyof PasswordForm;

function getPasswordStrength(password: string, t: ReturnType<typeof useTranslations>): {
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

  if (score <= 1) return { score, label: t("strength.weak"), color: "text-red-500", barColor: "bg-red-400", width: "w-1/5" };
  if (score <= 2) return { score, label: t("strength.fair"), color: "text-orange-500", barColor: "bg-orange-400", width: "w-2/5" };
  if (score <= 3) return { score, label: t("strength.good"), color: "text-yellow-600", barColor: "bg-yellow-400", width: "w-3/5" };
  if (score <= 4) return { score, label: t("strength.strong"), color: "text-blue-600", barColor: "bg-blue-500", width: "w-4/5" };
  return { score, label: t("strength.veryStrong"), color: "text-emerald-600", barColor: "bg-emerald-500", width: "w-full" };
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
            ? "border-primary-blue/30 bg-primary-blue/10"
            : "border-slate-200 bg-slate-50 focus-within:border-primary-blue focus-within:bg-white"
      }`}>
        <Lock size={16} className={error ? "text-red-400" : value ? "text-primary-blue" : "text-slate-400"} />
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
  const t = useTranslations("settings.changePassword");
  const toast = useToast();
  const changePasswordMutation = useChangePassword();

  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState<PasswordForm>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});

  const strength = getPasswordStrength(form.newPassword, t);

  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  function update(field: PasswordField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    changePasswordMutation.reset();
  }

  function validate(): boolean {
    const next: Partial<Record<PasswordField, string>> = {};

    if (!form.currentPassword) next.currentPassword = t("validation.currentRequired");
    if (!form.newPassword) next.newPassword = t("validation.newRequired");
    else if (form.newPassword.length < 8) next.newPassword = t("validation.minLength");
    else if (form.currentPassword && form.currentPassword === form.newPassword)
      next.newPassword = t("validation.mustDiffer");
    if (!form.confirmPassword) next.confirmPassword = t("validation.confirmRequired");
    else if (form.newPassword !== form.confirmPassword) next.confirmPassword = t("validation.mismatch");

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

      toast.success(t("toast.updated"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    } catch {
      toast.error(
        changePasswordMutation.error instanceof Error
          ? changePasswordMutation.error.message
          : t("toast.currentIncorrect")
      );
    }
  }

  const canSubmit = form.currentPassword && form.newPassword && form.confirmPassword && !changePasswordMutation.isPending;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-primary-blue to-primary-blue-dark" />

        <div className="flex items-center gap-4 px-4 py-5 sm:gap-5 sm:px-8 sm:py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/5 text-primary-blue sm:h-14 sm:w-14">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("header.title")}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{t("header.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label={t("fields.currentPassword")}
            value={form.currentPassword}
            show={show.current}
            onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
            onChange={(v) => update("currentPassword", v)}
            error={errors.currentPassword}
            placeholder={t("fields.currentPasswordPlaceholder")}
            disabled={changePasswordMutation.isPending}
          />

          <div className="space-y-3">
            <PasswordField
              label={t("fields.newPassword")}
              value={form.newPassword}
              show={show.new}
              onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}
              onChange={(v) => update("newPassword", v)}
              error={errors.newPassword}
              placeholder={t("fields.newPasswordPlaceholder")}
              disabled={changePasswordMutation.isPending}
            />

            {/* Strength meter */}
            {form.newPassword && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{t("strength.label")}</span>
                  <span className={`text-xs font-black ${strength.color}`}>{strength.label}</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength.barColor} ${strength.width}`} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Requirement met={form.newPassword.length >= 8} text={t("strength.req8chars")} />
                  <Requirement met={/[A-Z]/.test(form.newPassword)} text={t("strength.reqUppercase")} />
                  <Requirement met={/\d/.test(form.newPassword)} text={t("strength.reqNumber")} />
                  <Requirement met={/[!@#$%^&*]/.test(form.newPassword)} text={t("strength.reqSpecial")} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <PasswordField
              label={t("fields.confirmPassword")}
              value={form.confirmPassword}
              show={show.confirm}
              onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              onChange={(v) => update("confirmPassword", v)}
              error={errors.confirmPassword}
              placeholder={t("fields.confirmPasswordPlaceholder")}
              disabled={changePasswordMutation.isPending}
            />
            {passwordsMatch && !errors.confirmPassword && (
              <p className="text-xs font-semibold text-emerald-600">{t("passwordsMatch")}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-blue font-bold text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <DentalLoaderIcon className="h-4 w-4" />
                  {t("submit.updating")}
                </>
              ) : (
                t("submit.update")
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security tip */}
      <div className="rounded-2xl border border-primary-blue/10 bg-primary-blue/5 px-4 py-4 sm:px-5">
        <p className="text-sm text-primary-blue">
          <span className="font-bold">{t("tip.label")}</span> {t("tip.text")}
        </p>
      </div>
    </div>
  );
}