"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown, ChevronUp, Info, Plus, Trash2 } from "lucide-react";

import { useSocialsStore } from "@/src/store/socials.store";
import { useToast } from "@/src/lib/hooks/Usetoast";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import {
  PlatformIcon,
  SOCIAL_PLATFORM_COLOR,
  SOCIAL_PLATFORM_LABEL,
} from "@/src/features/socials/platformConfig";
import { SOCIAL_PLATFORMS, type SocialDisplayMode, type SocialPlatform } from "@/src/types/social.types";

export default function SocialsSettingsPage() {
  const t = useTranslations("settings.socials");
  const toast = useToast();

  const isHydrated = useSocialsStore((s) => s.isHydrated);
  const hydrateFromStorage = useSocialsStore((s) => s.hydrateFromStorage);
  const links = useSocialsStore((s) => s.links);
  const displayMode = useSocialsStore((s) => s.displayMode);
  const addLink = useSocialsStore((s) => s.addLink);
  const removeLink = useSocialsStore((s) => s.removeLink);
  const reorderLinks = useSocialsStore((s) => s.reorderLinks);
  const setDisplayMode = useSocialsStore((s) => s.setDisplayMode);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const [platform, setPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error(t("toast.invalidUrl"));
      return;
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    addLink(platform, normalized, label);
    setUrl("");
    setLabel("");
    toast.success(t("toast.added"));
  }

  function handleRemove(id: string) {
    removeLink(id);
    toast.success(t("toast.removed"));
  }

  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    reorderLinks(next);
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>{t("testNotice")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Add form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <h2 className="text-sm font-black text-slate-900">{t("form.title")}</h2>

            <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500">{t("form.platformLabel")}</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15"
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {SOCIAL_PLATFORM_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">{t("form.labelLabel")}</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t("form.labelPlaceholder")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500">{t("form.urlLabel")}</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t("form.urlPlaceholder")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-blue py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark sm:col-span-2"
              >
                <Plus size={16} />
                {t("form.addButton")}
              </button>
            </form>
          </div>

          {/* Links list */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <h2 className="text-sm font-black text-slate-900">{t("list.title")}</h2>

            {links.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">{t("list.empty")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {links.map((link, index) => (
                  <li
                    key={link.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: SOCIAL_PLATFORM_COLOR[link.platform] }}
                    >
                      <PlatformIcon platform={link.platform} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {link.label || SOCIAL_PLATFORM_LABEL[link.platform]}
                      </p>
                      <p className="truncate text-xs text-slate-400">{link.url}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLink(index, -1)}
                        disabled={index === 0}
                        aria-label={t("list.moveUp")}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLink(index, 1)}
                        disabled={index === links.length - 1}
                        aria-label={t("list.moveDown")}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(link.id)}
                        aria-label={t("list.delete")}
                        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Display mode + public page link */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <h2 className="text-sm font-black text-slate-900">{t("display.title")}</h2>
            <p className="mt-1 text-xs text-slate-500">{t("display.subtitle")}</p>

            <div className="mt-4">
              <SegmentedControl<SocialDisplayMode>
                value={displayMode}
                onChange={setDisplayMode}
                ariaLabel={t("display.title")}
                options={[
                  { key: "list", label: t("display.list") },
                  { key: "circle", label: t("display.circle") },
                ]}
              />
            </div>

            <Link
              href="/socials"
              target="_blank"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              {t("display.openPublicPage")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
