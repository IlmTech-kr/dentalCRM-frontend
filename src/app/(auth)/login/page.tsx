"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { login } from "@/src/features/auth/auth.service";

function getSubDomain() {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;

  if (host.includes(".localhost")) {
    return host.split(".")[0];
  }

  const parts = host.split(".");

  if (parts.length >= 3) {
    return parts[0];
  }

  return "";
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedLogin");

    if (saved) {
      const parsed = JSON.parse(saved);

      setForm({
        email: parsed.email || "",
        password: parsed.password || "",
      });

      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subDomain = getSubDomain();

    if (!subDomain) {
      alert("Clinic subdomain not found. Open clinic1.localhost:3000/login");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: form.email,
        password: form.password,
        subDomain,
      });

      if (rememberMe) {
        localStorage.setItem(
          "savedLogin",
          JSON.stringify({
            email: form.email,
            password: form.password,
          })
        );
      } else {
        localStorage.removeItem("savedLogin");
      }

      window.location.href = `http://${subDomain}.localhost:3000/dashboard`;
    } catch {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-light-background lg:grid lg:grid-cols-[48%_52%]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#3498db] px-14 py-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-36 right-10 h-[430px] w-[430px] rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 shadow-lg">
            <ShieldCheck size={34} />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              DentalCRM
            </h1>
            <p className="text-base text-white/85">
              Smart Clinic Management System
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-[150px] max-w-[620px]">
          <h2 className="text-[54px] font-extrabold leading-[1.15] tracking-tight">
            Manage Your Clinic Efficiently
          </h2>

          <p className="mt-8 text-xl leading-9 text-white/90">
            Patients, doctors, appointments, treatments and reports — everything
            in one modern platform.
          </p>
        </div>

        <p className="relative z-10 mt-auto text-sm text-white/75">
          © 2026 DentalCRM. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[500px] rounded-[28px] border border-border-color bg-white px-9 py-10 shadow-2xl shadow-slate-300/40"
        >
          <h2 className="text-[38px] font-extrabold leading-tight text-dark-navy">
            Welcome Back
          </h2>

          <p className="mt-3 text-base text-text-light">
            Login to your clinic dashboard
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                Email Address
              </label>

              <div className="flex h-16 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-5">
                <Mail size={21} className="text-slate-400" />

                <input
                  type="email"
                  className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="admin@clinic1.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                Password
              </label>

              <div className="flex h-16 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-5">
                <Lock size={21} className="text-slate-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 transition hover:text-primary-blue"
                >
                  {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="h-4 w-4 accent-[#35a8f5]"
              />

              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-bold text-primary-blue transition hover:text-primary-blue-dark"
            >
              Forgot Password?
            </Link>
          </div>

            <button
              disabled={loading}
              className="h-16 w-full rounded-2xl bg-[#35a8f5] text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1d8ee8] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-text-light">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-extrabold text-primary-blue">
              Create Clinic
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}