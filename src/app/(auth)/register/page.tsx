"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useState,
  type FormEvent,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { useRegisterClinic } from "@/src/features/auth/hooks/useAuth";
import { useToast } from "@/src/lib/hooks/Usetoast";

const FRONTEND_ROOT_DOMAIN = process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN || "";
const FRONTEND_PROTOCOL = process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL || "http";

/**
 * Register bo'lgandan keyin clinic login sahifasiga redirect.
 *
 * Local:      http://clinic1.localhost:3000/login
 * Production: https://clinic1.dentalcrm.uz/login
 */
function buildClinicLoginUrl(subDomain: string): string {
  if (FRONTEND_ROOT_DOMAIN && FRONTEND_ROOT_DOMAIN !== "localhost") {
    return `${FRONTEND_PROTOCOL}://${subDomain}.${FRONTEND_ROOT_DOMAIN}/login`;
  }

  // Local dev fallback
  const port = window.location.port ? `:${window.location.port}` : "";
  return `http://${subDomain}.localhost${port}/login`;
}

/**
 * Phone number ichidagi space, dash, bracketlarni olib tashlaydi.
 * Masalan:
 * +998 93 491 91 00 -> +998934919100
 */
function normalizeContactNumber(value: string): string {
  const withoutSpaces = value.replace(/\s+/g, "");
  const onlyDigitsAndPlus = withoutSpaces.replace(/[^\d+]/g, "");

  if (onlyDigitsAndPlus.includes("+")) {
    return `+${onlyDigitsAndPlus.replace(/\+/g, "")}`;
  }

  return onlyDigitsAndPlus;
}

export default function RegisterPage() {
  const toast = useToast();
  const t = useTranslations("auth");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useRegisterClinic();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
    clinicName: "",
    subDomain: "",
  });

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.warning(t("register.passwordsMismatch"));
      return;
    }

    try {
      await registerMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.contactNumber,
        password: form.password,
        clinicName: form.clinicName,
        subDomain: form.subDomain,
      });

      /**
       * Redirect — env dan dinamik URL
       */
      window.location.href = buildClinicLoginUrl(form.subDomain);
    } catch {
      // xato registerMutation.error da ko'rinadi
    }
  }

  return (
    <main className="grid h-screen grid-cols-1 overflow-hidden bg-[#eef7ff] lg:grid-cols-2">
      <section className="relative hidden h-screen overflow-hidden bg-[#3498db] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("brand.name")}</h1>
            <p className="text-white/80">{t("register.tagline")}</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-5xl font-bold leading-tight">
            {t("register.heroTitle")}
          </h2>
          <p className="mt-6 text-lg leading-8 text-white/85">
            {t("register.heroSubtitle")}
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/70">
          {t("register.copyright")}
        </p>
      </section>

      <section className="flex h-screen items-center justify-center overflow-hidden px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[470px] rounded-[26px] border border-[#d7e8f7] bg-white px-7 py-4 shadow-xl shadow-slate-300/30"
        >
          <h2 className="text-[28px] font-bold text-[#0f2f4f]">
            {t("register.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("register.subtitle")}
          </p>

          {registerMutation.error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : t("register.errorFallback")}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Input
              label={t("register.firstNameLabel")}
              icon={<User size={18} />}
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
              placeholder={t("register.firstNamePlaceholder")}
              disabled={registerMutation.isPending}
            />

            <Input
              label={t("register.lastNameLabel")}
              icon={<User size={18} />}
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              placeholder={t("register.lastNamePlaceholder")}
              disabled={registerMutation.isPending}
            />

            <Input
              label={t("register.emailLabel")}
              icon={<Mail size={18} />}
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder={t("register.emailPlaceholder")}
              type="email"
              disabled={registerMutation.isPending}
            />

            <Input
              label={t("register.contactNumberLabel")}
              icon={<Phone size={18} />}
              value={form.contactNumber}
              onChange={(v) =>
                setForm({
                  ...form,
                  contactNumber: normalizeContactNumber(v),
                })
              }
              placeholder={t("register.contactNumberPlaceholder")}
              type="tel"
              inputMode="tel"
              disabled={registerMutation.isPending}
            />

            <PasswordInput
              label={t("register.passwordLabel")}
              value={form.password}
              placeholder={t("register.passwordPlaceholder")}
              show={showPassword}
              onToggle={() => setShowPassword((p) => !p)}
              onChange={(v) => setForm({ ...form, password: v })}
              disabled={registerMutation.isPending}
            />

            <PasswordInput
              label={t("register.confirmPasswordLabel")}
              value={form.confirmPassword}
              placeholder={t("register.confirmPasswordPlaceholder")}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((p) => !p)}
              onChange={(v) => setForm({ ...form, confirmPassword: v })}
              disabled={registerMutation.isPending}
            />

            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs font-semibold text-red-500">
                {t("register.passwordsMismatch")}
              </p>
            )}

            {passwordsMatch && (
              <p className="text-xs font-semibold text-green-500">
                {t("register.passwordsMatch")} ✓
              </p>
            )}

            <Input
              label={t("register.clinicNameLabel")}
              icon={<Building2 size={18} />}
              value={form.clinicName}
              onChange={(v) => setForm({ ...form, clinicName: v })}
              placeholder={t("register.clinicNamePlaceholder")}
              disabled={registerMutation.isPending}
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                {t("register.subdomainLabel")}
              </label>
              <div className="flex h-10 items-center gap-3 rounded-xl border border-[#d7e8f7] bg-slate-50 px-4">
                <Building2 size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                  placeholder={t("register.subdomainPlaceholder")}
                  value={form.subDomain}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subDomain: e.target.value.toLowerCase().trim(),
                    })
                  }
                  disabled={registerMutation.isPending}
                />
                <span className="text-sm text-slate-400">
                  .{FRONTEND_ROOT_DOMAIN || "localhost"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                registerMutation.isPending ||
                !form.firstName ||
                !form.email ||
                !form.contactNumber ||
                !form.password ||
                !form.clinicName ||
                !form.subDomain ||
                !passwordsMatch
              }
              className="mt-1 h-10 w-full rounded-xl bg-[#35a8f5] text-sm font-bold text-white shadow-lg shadow-blue-300 transition hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerMutation.isPending ? t("register.submitting") : t("register.submitButton")}
            </button>
          </div>

          <p className="mt-3 text-center text-sm text-slate-500">
            {t("register.alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-bold text-[#35a8f5]">
              {t("register.signIn")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function Input({
  label,
  icon,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  inputMode,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-600">
        {label}
      </label>
      <div className="flex h-10 items-center gap-3 rounded-xl border border-[#d7e8f7] bg-slate-50 px-4">
        <span className="text-slate-400">{icon}</span>
        <input
          type={type}
          inputMode={inputMode}
          className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-600">
        {label}
      </label>
      <div className="flex h-10 items-center gap-3 rounded-xl border border-[#d7e8f7] bg-slate-50 px-4">
        <Lock size={18} className="text-slate-400" />
        <input
          type={show ? "text" : "password"}
          className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="text-slate-400 transition hover:text-[#35a8f5] disabled:opacity-50"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}