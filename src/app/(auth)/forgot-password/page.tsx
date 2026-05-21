"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useForgotPassword } from "@/src/features/auth/hooks/useAuth";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ✅ USE REACT QUERY HOOK
  const forgotPasswordMutation = useForgotPassword();

  const isValidEmailInput = isValidEmail(email);

  // Handle countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [resendCountdown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    if (!isValidEmailInput) {
      return;
    }

    const subDomain = getSubDomain();

    if (!subDomain) {
      alert("Clinic subdomain not found");
      return;
    }

    try {
      // ✅ USE MUTATION
      await forgotPasswordMutation.mutateAsync({
        email: email.trim(),
        subDomain,
      });

      setSuccess(true);
      setAttemptCount(attemptCount + 1);
      setResendCountdown(60);
    } catch (error) {
      // ✅ ERROR HANDLED BY MUTATION
      console.error("Forgot password error:", error);
    }
  }

  function handleReset() {
    setSuccess(false);
    setEmail("");
    setAttemptCount(0);
    setResendCountdown(0);
    forgotPasswordMutation.reset();
  }

  return (
    <main className="min-h-screen bg-light-background lg:grid lg:grid-cols-[48%_52%]">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#3498db] via-[#2980b9] to-[#1e5fa0] px-14 py-12 text-white lg:flex lg:flex-col">
        {/* Decorative blobs */}
        <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-36 right-10 h-[430px] w-[430px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
            <ShieldCheck size={34} />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold">
              DentalCRM
            </h1>

            <p className="text-white/80">
              Smart Clinic Management
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-[150px]">
          <h2 className="text-5xl font-extrabold leading-tight">
            Recover Your Account
          </h2>

          <p className="mt-8 text-xl leading-9 text-white/85">
            Don't worry! We'll send you a secure
            link to reset your password in just
            a few seconds.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle
                size={24}
                className="flex-shrink-0 mt-1 text-white/90"
              />
              <p className="text-sm text-white/80">
                Secure reset link sent via email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle
                size={24}
                className="flex-shrink-0 mt-1 text-white/90"
              />
              <p className="text-sm text-white/80">
                Link expires in 24 hours
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle
                size={24}
                className="flex-shrink-0 mt-1 text-white/90"
              />
              <p className="text-sm text-white/80">
                Your data remains protected
              </p>
            </div>
          </div>
        </div>

        <p className="mt-auto text-white/70">
          © 2026 DentalCRM
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[430px] rounded-[24px] border border-border-color bg-white px-8 py-8 shadow-xl"
        >
          {!success ? (
            <>
              <h2 className="text-3xl font-extrabold text-dark-navy">
                Forgot Password?
              </h2>

              <p className="mt-2 text-sm text-text-light">
                Enter your clinic email and we'll
                send a password reset link
              </p>

              {/* ✅ ERROR MESSAGE FROM MUTATION */}
              {forgotPasswordMutation.error && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 flex items-start gap-3 border border-red-200">
                  <AlertCircle
                    size={18}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    {forgotPasswordMutation.error instanceof Error
                      ? forgotPasswordMutation.error.message
                      : "Failed to send reset link. Please try again."}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Email Address
                </label>

                <div
                  className={`flex h-14 items-center gap-3 rounded-2xl border transition-colors ${
                    forgotPasswordMutation.error
                      ? "border-red-300 bg-red-50"
                      : isValidEmailInput && email
                        ? "border-green-300 bg-green-50"
                        : "border-border-color bg-slate-50"
                  } px-5`}
                >
                  <Mail
                    size={20}
                    className={
                      forgotPasswordMutation.error
                        ? "text-red-400"
                        : isValidEmailInput && email
                          ? "text-green-400"
                          : "text-slate-400"
                    }
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      forgotPasswordMutation.reset();
                    }}
                    placeholder="admin@clinic.com"
                    className="w-full bg-transparent outline-none placeholder-slate-400 disabled:opacity-50"
                    autoComplete="email"
                    disabled={forgotPasswordMutation.isPending}
                  />

                  {isValidEmailInput && email && (
                    <CheckCircle
                      size={20}
                      className="flex-shrink-0 text-green-500"
                    />
                  )}
                </div>

                {email && !isValidEmailInput && (
                  <p className="mt-2 text-xs text-red-600 font-medium">
                    Please enter a valid email
                  </p>
                )}

                {isValidEmailInput && (
                  <p className="mt-2 text-xs text-green-600 font-medium">
                    ✓ Email looks good
                  </p>
                )}
              </div>

              {/* ✅ SUBMIT BUTTON WITH MUTATION STATE */}
              <button
                type="submit"
                disabled={
                  forgotPasswordMutation.isPending ||
                  !email ||
                  !isValidEmailInput
                }
                className="mt-6 h-14 w-full rounded-2xl bg-primary-blue font-bold text-white transition hover:bg-primary-blue-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader
                      size={18}
                      className="animate-spin"
                    />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <Link
                href="/login"
                className="mt-6 flex items-center gap-2 text-sm font-bold text-primary-blue hover:text-primary-blue-dark transition"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>

              {attemptCount > 0 && (
                <p className="mt-4 text-xs text-slate-500 text-center">
                  {attemptCount === 1
                    ? "Reset link sent"
                    : `${attemptCount} reset link${attemptCount > 1 ? "s" : ""} sent`}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <CheckCircle
                    size={48}
                    className="text-green-600"
                  />
                </div>

                <h2 className="text-2xl font-extrabold text-dark-navy">
                  Check Your Email
                </h2>

                <p className="mt-3 text-sm text-text-light">
                  We've sent a password reset link to:
                </p>

                <p className="mt-2 font-semibold text-slate-700 break-all">
                  {email}
                </p>

                <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700 border border-blue-200">
                  <p className="font-medium mb-2">
                    What's next?
                  </p>
                  <ul className="space-y-2 text-left">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">
                        1.
                      </span>
                      <span>
                        Check your email for the
                        reset link
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">
                        2.
                      </span>
                      <span>
                        Click the link to create a
                        new password
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">
                        3.
                      </span>
                      <span>
                        Log in with your new
                        password
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Link expires in 24 hours
                </p>
              </div>

              {/* ✅ RESEND BUTTON WITH COUNTDOWN */}
              <button
                type="button"
                onClick={handleReset}
                disabled={resendCountdown > 0}
                className="mt-8 h-14 w-full rounded-2xl bg-slate-100 font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Send Another Link"}
              </button>

              <Link
                href="/login"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-primary-blue hover:text-primary-blue-dark transition"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>

              <p className="mt-6 text-xs text-slate-500 text-center">
                Didn't receive the email?{" "}
                <span className="text-slate-400">
                  Check your spam folder or try
                  another email
                </span>
              </p>
            </>
          )}
        </form>
      </section>
    </main>
  );
}