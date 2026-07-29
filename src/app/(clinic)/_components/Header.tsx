"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useLogout } from "@/src/features/auth/hooks/useAuth";
import { useStorageImage } from "@/src/features/storage/hooks/useStorage";
import { STORAGE_BUCKET } from "@/src/types/storage.types";
import { useAuthStore } from "@/src/store/auth.store";
import { LanguageSwitcher } from "@/src/components/shared/LanguageSwitcher";
import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

export default function Header() {
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const logoutMutation = useLogout();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border-color bg-white/80 px-8 backdrop-blur">
        <div>
          <h2 className="text-2xl font-extrabold text-dark-navy">
            {t("header.dashboardTitle")}
          </h2>

          <p className="text-sm text-text-light">
            {t("header.welcomeSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden h-11 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-4 md:flex">
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              className="bg-transparent text-sm outline-none"
              placeholder={t("header.searchPlaceholder")}
            />
          </div>

          <LanguageSwitcher />

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-color bg-white transition hover:bg-slate-50"
          >
            <Bell size={19} />
          </button>

          <div className="relative z-30">
            <button
              type="button"
              onClick={() =>
                setDropdownOpen((previous) => !previous)
              }
              className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3 transition hover:bg-slate-50"
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-600">
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

                <p className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
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
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-border-color bg-white shadow-lg">
                <div className="border-b border-border-color p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
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
                          className="inline-block rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
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

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-20 cursor-default bg-transparent"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </>
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