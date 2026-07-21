"use client";

/**
 * File: src/app/superadmin/login/page.tsx
 *
 * admin.dental.ilmtech.uz/login shu sahifaga middleware orqali rewrite qilinadi.
 * Bu yerda hech qanday tenant subdomain tekshirilmaydi — login to'g'ridan-to'g'ri
 * mainHttp (dental.api.ilmtech.uz) ga ketadi.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";

import { useSuperAdminLogin } from "@/src/features/superadmin/auth/hook/UseSuperAdminAuth";
import { getSuperAdminMe } from "@/src/features/superadmin/auth/service/superadmin.auth.service";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { getStoredUser, saveUser, clearAuthStorage } from "@/src/lib/auth/storage";
import DentalLoader from "@/src/components/ui/DentalLoader";

function getErrorMessage(error: unknown): string {
  if (!error) return "Login failed";
  if (error instanceof Error) return error.message || "Login failed";
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: string }).message || "Login failed");
  }
  return "Login failed";
}

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const loginMutation = useSuperAdminLogin();

  const [checkingSession, setCheckingSession] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function init() {
      const storedUser = getStoredUser();
      if (!storedUser) {
        setCheckingSession(false);
        return;
      }

      try {
        const me = await getSuperAdminMe();
        saveUser(me);
        router.replace("/dashboard");
      } catch {
        clearAuthStorage();
        setCheckingSession(false);
      }
    }

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checkingSession) {
    return <DentalLoader text="Checking session..." />;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      const user = res?.user || res?.data?.user || res;
      saveUser(user);
      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-light-background px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[440px] rounded-[28px] border border-border-color bg-white px-9 py-10 shadow-2xl shadow-slate-300/40"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3498db] text-white shadow-lg">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-dark-navy">Super Admin</h2>
            <p className="text-sm text-text-light">DentalCRM boshqaruv paneli</p>
          </div>
        </div>

        {loginMutation.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">
              {getErrorMessage(loginMutation.error)}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-600">Email</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-4">
              <Mail size={19} className="text-slate-400" />
              <input
                type="email"
                className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                placeholder="superadmin@dentalcrm.uz"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loginMutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-600">Parol</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-4">
              <Lock size={19} className="text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                placeholder="Parolni kiriting"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-slate-400 transition hover:text-primary-blue"
                disabled={loginMutation.isPending}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending || !form.email.trim() || !form.password}
            className="h-14 w-full rounded-2xl bg-[#35a8f5] text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? "Kirilmoqda..." : "Kirish"}
          </button>
        </div>
      </form>
    </main>
  );
}