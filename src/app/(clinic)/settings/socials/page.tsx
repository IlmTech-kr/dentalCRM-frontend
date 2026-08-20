"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Camera, ChevronDown, ChevronUp, Mail, Phone, Plus, RefreshCw, Trash2 } from "lucide-react";

import { useSocialsStore } from "@/src/store/socials.store";
import { useToast } from "@/src/lib/hooks/Usetoast";
import {
  useGetClinicProfile,
  useUpdateClinicProfile,
} from "@/src/features/clinicProfile/hooks/useClinicProfile";
import { useStorageImage, useUploadFile } from "@/src/features/storage/hooks/useStorage";
import { STORAGE_BUCKET, StorageTarget } from "@/src/types/storage.types";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { buildTenantBaseUrl } from "@/src/lib/api/http";
import { getCurrentSubdomain } from "@/src/lib/tenant.client";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";
import { ModalShell } from "@/src/components/ui/ModalShell";
import { ModalFormActions } from "@/src/components/ui/ModalFormActions";
import {
  PlatformIcon,
  SOCIAL_PLATFORM_COLOR,
  SOCIAL_PLATFORM_LABEL,
} from "@/src/features/socials/platformConfig";
import {
  SOCIAL_PLATFORMS,
  type SocialDisplayMode,
  type SocialLink,
  type SocialPlatform,
} from "@/src/types/social.types";

/**
 * Backend `imageUrl`ni to'liq HTTP(S) URL sifatida talab qiladi ("Public
 * profil URLi HTTP(S) formatida bo'lishi kerak" — saqlashda xatolik
 * berayotgan edi), storage upload esa nisbiy yo'l qaytaradi (masalan
 * "clinics/abc.png"). Shu funksiya nisbiy yo'lni joriy tenant domeni
 * bilan to'liq URLga aylantiradi.
 */
function buildAbsoluteStorageUrl(storagePath: string): string {
  const subdomain = getCurrentSubdomain();
  if (!subdomain) return storagePath;

  try {
    return `${buildTenantBaseUrl(subdomain)}${ENDPOINTS.storage.file(STORAGE_BUCKET, storagePath)}`;
  } catch {
    return storagePath;
  }
}

export default function SocialsSettingsPage() {
  const t = useTranslations("settings.socials");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const isDisplayModeHydrated = useSocialsStore((s) => s.isHydrated);
  const hydrateFromStorage = useSocialsStore((s) => s.hydrateFromStorage);
  const displayMode = useSocialsStore((s) => s.displayMode);
  const setDisplayMode = useSocialsStore((s) => s.setDisplayMode);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const { data: profile, isLoading, isError, refetch } = useGetClinicProfile();
  const updateMutation = useUpdateClinicProfile();
  const uploadMutation = useUploadFile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string>("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  // Backenddan kelgan socials — mahalliy tahrirlanadigan holatga ko'chiriladi.
  // `order` bo'yicha saralanadi (bkz. social.types.ts) — backend shu maydon
  // bilan ko'rsatish tartibini belgilaydi.
  const [socials, setSocials] = useState<SocialLink[]>([]);

  // Klinika profili maydonlari — companyName/bio/imageUrl (storage path)/
  // phoneNumber/email. Backend bular hali to'ldirilmagan bo'lsa `null`
  // qaytaradi (bo'sh satr emas) — shuning uchun hammasi `?? ""` bilan
  // tahrirlanadigan (controlled) inputga o'giriladi.
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const sortedSocials = [...(profile?.socials ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    setSocials(sortedSocials);
    setCompanyName(profile?.companyName ?? "");
    setBio(profile?.bio ?? "");
    setImageUrl(profile?.imageUrl ?? "");
    setPhoneNumber(profile?.phoneNumber ?? "");
    setEmail(profile?.email ?? "");
  }, [profile]);

  const clinicImage = useStorageImage(imageUrl, STORAGE_BUCKET);
  const clinicImageSrc = localPreviewUrl || clinicImage.url;
  const isClinicImageLoading =
    uploadMutation.isPending ||
    Boolean(imageUrl && !clinicImageSrc && clinicImage.isFetching);

  // Server rasmi yuklangach, vaqtinchalik local preview o'chiriladi.
  useEffect(() => {
    if (!clinicImage.url || !localPreviewRef.current) return;
    URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = "";
    setLocalPreviewUrl("");
  }, [clinicImage.url]);

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    };
  }, []);

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning(t("toast.selectImageFile"));
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning(t("toast.imageTooLarge"));
      e.target.value = "";
      return;
    }

    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    const nextPreviewUrl = URL.createObjectURL(file);
    localPreviewRef.current = nextPreviewUrl;
    setLocalPreviewUrl(nextPreviewUrl);

    try {
      const uploadedFile = await uploadMutation.mutateAsync({
        file,
        target: StorageTarget.CLINICS,
        bucket: STORAGE_BUCKET,
      });
      setImageUrl(buildAbsoluteStorageUrl(uploadedFile.storagePath));
      toast.success(t("toast.imageUploaded"));
    } catch (error) {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = "";
      }
      setLocalPreviewUrl("");
      toast.error(error instanceof Error ? error.message : t("toast.imageUploadFailed"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const [platform, setPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [url, setUrl] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error(t("toast.invalidUrl"));
      return;
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setSocials((prev) => {
      const existingIndex = prev.findIndex((link) => link.platform === platform);
      if (existingIndex === -1) return [...prev, { platform, url: normalized }];
      const next = [...prev];
      next[existingIndex] = { platform, url: normalized };
      return next;
    });

    setUrl("");
    setIsAddOpen(false);
  }

  function closeAddModal() {
    setIsAddOpen(false);
    setUrl("");
  }

  function handleRemove(targetPlatform: SocialPlatform) {
    setSocials((prev) => prev.filter((link) => link.platform !== targetPlatform));
  }

  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= socials.length) return;
    setSocials((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSave() {
    if (!profile) return;
    if (uploadMutation.isPending) {
      toast.warning(t("toast.imageStillUploading"));
      return;
    }
    // Joriy (yuqoriga/pastga surilgan) ro'yxat tartibiga mos `order` qayta
    // hisoblanadi — backend shu maydonga qarab ommaviy sahifada tartiblaydi.
    const orderedSocials = socials.map((link, index) => ({ ...link, order: index + 1 }));
    updateMutation.mutate(
      {
        ...profile,
        companyName: companyName.trim(),
        bio: bio.trim(),
        imageUrl,
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        socials: orderedSocials,
      },
      {
        onSuccess: () => toast.success(t("toast.saved")),
        onError: (error) => toast.error(error.message || t("toast.saveFailed")),
      }
    );
  }

  if (!isDisplayModeHydrated) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{tCommon("feedback.error")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-primary-blue transition hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            {tCommon("actions.confirm")}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Clinic profile — nomi, rasmi, bio, aloqa va socials bitta kartada */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-900">{t("profile.title")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("profile.subtitle")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen((prev) => !prev)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-blue px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-blue-dark"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">{t("form.addButton")}</span>
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary-blue/10 shadow-md ring-4 ring-white">
                    {clinicImageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={clinicImageSrc}
                        alt={t("profile.photoLabel")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera size={20} className="text-primary-blue/60" />
                    )}

                    {isClinicImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                        <DentalLoaderIcon size={18} className="text-white" />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-blue text-white shadow-lg transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                    title={t("profile.changePhoto")}
                  >
                    <Camera size={12} />
                  </button>

                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    disabled={uploadMutation.isPending}
                  />
                </div>

                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500">
                    {t("profile.companyNameLabel")}
                  </label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t("profile.companyNamePlaceholder")}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-500">{t("profile.bioLabel")}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("profile.bioPlaceholder")}
                  disabled={isLoading}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15 disabled:opacity-50"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-500">{t("profile.phoneLabel")}</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/15">
                    <Phone size={16} className="shrink-0 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t("profile.phonePlaceholder")}
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">{t("profile.emailLabel")}</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/15">
                    <Mail size={16} className="shrink-0 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("profile.emailPlaceholder")}
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Socials list — kartaning davomi, alohida karta/sarlavhasiz */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : socials.length === 0 ? (
                  <p className="text-sm text-slate-400">{t("list.empty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {socials.map((link, index) => (
                      <li
                        key={link.platform}
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
                            {SOCIAL_PLATFORM_LABEL[link.platform]}
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
                            disabled={index === socials.length - 1}
                            aria-label={t("list.moveDown")}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(link.platform)}
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

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || updateMutation.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-blue py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateMutation.isPending && <DentalLoaderIcon size={16} />}
                  {t("list.save")}
                </button>
              </div>
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
      )}

      {isAddOpen && (
        <ModalShell title={t("form.title")} onClose={closeAddModal} maxWidthClassName="max-w-md">
          <form onSubmit={handleAdd} className="space-y-4 px-6 py-6">
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
              <label className="text-xs font-bold text-slate-500">{t("form.urlLabel")}</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("form.urlPlaceholder")}
                autoFocus
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/15"
              />
            </div>

            <ModalFormActions
              cancelLabel={tCommon("actions.cancel")}
              submitLabel={t("form.addButton")}
              onCancel={closeAddModal}
              isSubmitting={false}
            />
          </form>
        </ModalShell>
      )}
    </div>
  );
}
