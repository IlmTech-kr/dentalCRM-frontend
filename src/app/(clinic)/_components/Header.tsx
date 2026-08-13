"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useLogout } from "@/src/features/auth/hooks/useAuth";
import { useStorageImage } from "@/src/features/storage/hooks/useStorage";
import { STORAGE_BUCKET } from "@/src/types/storage.types";
import { useAuthStore } from "@/src/store/auth.store";
import { LanguageSwitcher } from "@/src/components/shared/LanguageSwitcher";
import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { useUiStore } from "@/src/store/ui.store";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logoutMutation = useLogout();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setAiDrawerOpen = useUiStore((state) => state.setAiDrawerOpen);

  const avatarPath = user?.avatarUrl?.trim() || "";

  /**
   * avatarUrl quyidagicha bo‘lishi mumkin:
   *
   * users/avatar.png
   * https://example.com/avatar.png
   * blob:http://localhost/...
   *
   * Storage path bo‘lsa backenddan Blob qilib olinadi.
   */
  const avatarImage = useStorageImage(
    avatarPath,
    STORAGE_BUCKET
  );

  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);

      logout();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ||
        user?.lastName ||
        user?.email ||
        "User";

  const firstLetter =
    displayName[0]?.toUpperCase() || "U";

  const roleDisplay = user?.roles?.[0]
    ? formatRole(user.roles[0])
    : "User";

  const avatarSrc =
    avatarImage.url && !avatarFailed
      ? avatarImage.url
      : "";

  const isAvatarLoading =
    Boolean(avatarPath) &&
    avatarImage.isFetching &&
    !avatarSrc;

  return (
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between gap-3 rounded-b-[20px] border-b border-primary-blue/10 bg-gradient-to-r from-primary-blue/15 via-white/70 to-white/70 px-4 shadow-sm shadow-primary-blue/5 backdrop-blur-2xl sm:h-20 sm:px-8 lg:sticky lg:inset-x-auto">
        {/* Decorative glow layer — clipped separately so it never covers the dropdown menus below. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[20px]">
          <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-primary-blue/20 blur-3xl" />
          <div className="absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-primary-blue/15 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-x-5 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-primary-blue via-primary-blue-dark to-primary-blue opacity-70" />

        <div className="relative flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-blue/20 text-primary-blue backdrop-blur-sm transition hover:scale-105 hover:bg-primary-blue/10 active:scale-95 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h2 className="truncate bg-gradient-to-r from-dark-navy to-primary-blue bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-2xl">
              {t("header.dashboardTitle")}
            </h2>

            <p className="hidden text-sm text-text-light sm:block">
              {t("header.welcomeSubtitle")}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-cyan-700/15 bg-white/80 px-3 text-xs font-semibold text-cyan-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-700/30 hover:bg-white active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 sm:h-11"
            aria-label="AI Copilotni ochish"
          >
            <Sparkles size={16} />
            <span className="hidden md:inline">Copilot</span>
          </button>

          <LanguageSwitcher tone="accent" />

          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary-blue/20 bg-primary-blue/10 text-primary-blue backdrop-blur-sm transition hover:scale-105 hover:bg-primary-blue/20 active:scale-95 sm:h-11 sm:w-11"
          >
            <Bell size={19} />
          </button>

          <div className="hidden h-8 w-px bg-primary-blue/15 sm:block" />

          <div ref={dropdownRef} className="relative z-30">
            <button
              type="button"
              onClick={() =>
                setDropdownOpen((previous) => !previous)
              }
              className="flex h-10 items-center gap-2 rounded-2xl bg-white px-2 backdrop-blur-sm transition hover:bg-primary-blue/10 sm:h-11 sm:px-3"
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-blue/10 text-xs font-bold text-primary-blue ring-2 ring-primary-blue/15">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span>{firstLetter}</span>
                )}

                {isAvatarLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                    <DentalLoaderIcon size={14} className="text-white" />
                  </div>
                )}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-40 truncate text-xs font-bold text-slate-900">
                  {displayName}
                </p>

                <p className="inline-block rounded-full bg-primary-blue/10 px-3 py-0.5 text-xs font-semibold text-primary-blue">
                  {roleDisplay}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-primary-blue/15 bg-white shadow-xl shadow-primary-blue/10">
                <div className="h-1 bg-gradient-to-r from-primary-blue via-primary-blue-dark to-primary-blue" />
                <div className="border-b border-border-color p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-blue/10 text-sm font-bold text-primary-blue ring-2 ring-primary-blue/15">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          className="h-full w-full object-cover"
                          onError={() =>
                            setAvatarFailed(true)
                          }
                        />
                      ) : (
                        <span>{firstLetter}</span>
                      )}

                      {isAvatarLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                          <DentalLoaderIcon size={16} className="text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {t("header.loggedInAs")}
                      </p>

                      <p className="truncate font-bold text-slate-900">
                        {displayName}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {user?.roles?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded-full bg-primary-blue/10 px-3 py-1.5 text-xs font-semibold text-primary-blue"
                        >
                          {formatRole(role)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1 p-2">
                  <Link
                    href="/settings/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    👤 {t("header.profileSettings")}
                  </Link>

                  <Link
                    href="/settings/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    🔐 {t("header.changePassword")}
                  </Link>

                  <div className="my-1 border-t border-border-color" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {logoutMutation.isPending ? (
                      <DentalLoaderIcon size={16} />
                    ) : (
                      <LogOut size={16} />
                    )}

                    {logoutMutation.isPending
                      ? t("header.loggingOut")
                      : tCommon("actions.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
  );
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}
