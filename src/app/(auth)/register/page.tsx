"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRegisterClinic } from "@/src/features/auth/hooks/useAuth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ USE REACT QUERY HOOK
  const registerMutation = useRegisterClinic();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    clinicName: "",
    subDomain: "",
  });

  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // ✅ USE MUTATION
      await registerMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        clinicName: form.clinicName,
        subDomain: form.subDomain,
      });

      window.location.href = `http://${form.subDomain}.localhost:3000/login`;
    } catch (error) {
      // ✅ ERROR HANDLED BY MUTATION
      console.error("Registration error:", error);
    }
  }

  return (
    <main className="h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#eef7ff]">
      <section className="relative hidden h-screen overflow-hidden bg-[#3498db] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck size={30} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">DentalCRM</h1>
            <p className="text-white/80">Smart Clinic Management System</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-5xl font-bold leading-tight">
            Build Your Modern Dental Clinic
          </h2>

          <p className="mt-6 text-lg leading-8 text-white/85">
            Manage patients, appointments, doctors, reports and treatments in
            one secure cloud platform.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/70">
          © 2026 DentalCRM. All rights reserved.
        </p>
      </section>

      <section className="flex h-screen items-center justify-center overflow-hidden px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[470px] rounded-[26px] border border-[#d7e8f7] bg-white px-7 py-4 shadow-xl shadow-slate-300/30"
        >
          <h2 className="text-[28px] font-bold text-[#0f2f4f]">
            Create Clinic
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Start managing your clinic digitally
          </p>

          {/* ✅ ERROR MESSAGE FROM MUTATION */}
          {registerMutation.error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-700 font-semibold">
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : "Registration failed. Please try again."}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Input
              label="First Name"
              icon={<User size={18} />}
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
              placeholder="Ali"
              disabled={registerMutation.isPending}
            />

            <Input
              label="Last Name"
              icon={<User size={18} />}
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              placeholder="Karimov"
              disabled={registerMutation.isPending}
            />

            <Input
              label="Email Address"
              icon={<Mail size={18} />}
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="admin@clinic1.com"
              disabled={registerMutation.isPending}
            />

            <PasswordInput
              label="Password"
              value={form.password}
              placeholder="Create password"
              show={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              onChange={(v) => setForm({ ...form, password: v })}
              disabled={registerMutation.isPending}
            />

            <PasswordInput
              label="Confirm Password"
              value={form.confirmPassword}
              placeholder="Confirm password"
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              onChange={(v) => setForm({ ...form, confirmPassword: v })}
              disabled={registerMutation.isPending}
            />

            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs font-semibold text-red-500">
                Passwords do not match
              </p>
            )}

            {passwordsMatch && (
              <p className="text-xs font-semibold text-green-500">
                Passwords match
              </p>
            )}

            <Input
              label="Clinic Name"
              icon={<Building2 size={18} />}
              value={form.clinicName}
              onChange={(v) => setForm({ ...form, clinicName: v })}
              placeholder="Dental Smile Clinic"
              disabled={registerMutation.isPending}
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">
                Clinic Subdomain
              </label>

              <div className="flex h-10 items-center gap-3 rounded-xl border border-[#d7e8f7] bg-slate-50 px-4">
                <Building2 size={18} className="text-slate-400" />

                <input
                  className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                  placeholder="clinic1"
                  value={form.subDomain}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subDomain: e.target.value.toLowerCase().trim(),
                    })
                  }
                  disabled={registerMutation.isPending}
                />

                <span className="text-sm text-slate-400">.localhost</span>
              </div>
            </div>

            {/* ✅ USE MUTATION STATE */}
            <button
              disabled={registerMutation.isPending || !form.firstName || !form.email || !form.password || !form.clinicName || !form.subDomain}
              className="mt-1 h-10 w-full rounded-xl bg-[#35a8f5] text-sm font-bold text-white shadow-lg shadow-blue-300 transition hover:bg-[#1d8ee8] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? "Creating..." : "Create Clinic"}
            </button>
          </div>

          <p className="mt-3 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#35a8f5]">
              Sign In
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
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-600">
        {label}
      </label>

      <div className="flex h-10 items-center gap-3 rounded-xl border border-[#d7e8f7] bg-slate-50 px-4 disabled:opacity-50">
        <span className="text-slate-400">{icon}</span>

        <input
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
          className="text-slate-400 transition hover:text-[#35a8f5] disabled:opacity-50"
          disabled={disabled}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}