"use client";

import {
  Camera,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";

import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

import { useTranslations } from "next-intl";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useGetProfile,
  useUpdateProfile,
} from "@/src/features/users/hooks/useUser";

import {
  useStorageImage,
  useUploadFile,
} from "@/src/features/storage/hooks/useStorage";

import {
  STORAGE_BUCKET,
  StorageTarget,
} from "@/src/types/storage.types";

import { useToast } from "@/src/lib/hooks/Usetoast";

function formatRole(
  role: string
): string {
  return role
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

function getInitials(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName[0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return "U";
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 animate-pulse bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center gap-4 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-slate-200 sm:h-14 sm:w-14" />

          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />

            <div className="h-4 w-28 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-2xl bg-slate-100"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileInputProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange?: (
    value: string
  ) => void;
  disabled?: boolean;
  type?: string;
  placeholderDash: string;
  enterFieldPlaceholder: string;
}

function ProfileInput({
  label,
  icon,
  value,
  onChange,
  disabled = false,
  type = "text",
  placeholderDash,
  enterFieldPlaceholder,
}: ProfileInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div
        className={`flex h-12 items-center gap-3 rounded-2xl border-2 px-4 transition-all ${
          disabled
            ? "border-slate-100 bg-slate-50"
            : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-400"
        }`}
      >
        <span className="shrink-0 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
          placeholder={
            disabled
              ? placeholderDash
              : enterFieldPlaceholder
          }
          disabled={disabled}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const localPreviewRef =
    useRef<string>("");

  const t = useTranslations("settings.profile");
  const toast = useToast();

  const {
    data: profileData,
    isLoading,
    error: loadError,
  } = useGetProfile();

  const updateMutation =
    useUpdateProfile();

  const uploadMutation =
    useUploadFile();

  const [form, setForm] =
    useState({
      firstName: "",
      lastName: "",
      phoneNumber: "",

      /**
       * Bu yerda to‘liq URL emas,
       * storage path saqlanadi:
       *
       * users/avatar.png
       */
      avatarUrl: "",
    });

  const [
    localPreviewUrl,
    setLocalPreviewUrl,
  ] = useState("");

  /**
   * avatarUrl storage path bo‘lsa,
   * backenddan blob sifatida olinadi.
   */
  const avatarImage =
    useStorageImage(
      form.avatarUrl,
      STORAGE_BUCKET
    );

  useEffect(() => {
    if (!profileData) {
      return;
    }

    setForm({
      firstName:
        profileData.firstName || "",

      lastName:
        profileData.lastName || "",

      phoneNumber:
        profileData.phoneNumber || "",

      avatarUrl:
        profileData.avatarUrl || "",
    });
  }, [profileData]);

  useEffect(() => {
    if (!loadError) {
      return;
    }

    toast.error(
      loadError instanceof Error
        ? loadError.message
        : t("toast.loadFailed")
    );
  }, [loadError]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Server rasmi yuklangach,
   * vaqtinchalik local preview o‘chiriladi.
   */
  useEffect(() => {
    if (
      !avatarImage.url ||
      !localPreviewRef.current
    ) {
      return;
    }

    URL.revokeObjectURL(
      localPreviewRef.current
    );

    localPreviewRef.current = "";

    setLocalPreviewUrl("");
  }, [avatarImage.url]);

  /**
   * Component yopilganda local blob URLni tozalash.
   */
  useEffect(() => {
    return () => {
      if (
        localPreviewRef.current
      ) {
        URL.revokeObjectURL(
          localPreviewRef.current
        );
      }
    };
  }, []);

  function createLocalPreview(
    file: File
  ) {
    if (
      localPreviewRef.current
    ) {
      URL.revokeObjectURL(
        localPreviewRef.current
      );
    }

    const nextPreviewUrl =
      URL.createObjectURL(file);

    localPreviewRef.current =
      nextPreviewUrl;

    setLocalPreviewUrl(
      nextPreviewUrl
    );
  }

  function clearLocalPreview() {
    if (
      localPreviewRef.current
    ) {
      URL.revokeObjectURL(
        localPreviewRef.current
      );
    }

    localPreviewRef.current = "";

    setLocalPreviewUrl("");
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.warning(
        t("toast.selectImageFile")
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.warning(
        t("toast.imageTooLarge")
      );

      event.target.value = "";

      return;
    }

    /**
     * Upload boshlanishidan oldin
     * lokal preview ko‘rsatiladi.
     */
    createLocalPreview(file);

    try {
      const uploadedFile =
        await uploadMutation.mutateAsync(
          {
            file,

            /**
             * Backendga aynan:
             * target=users
             *
             * yuboriladi.
             */
            target:
              StorageTarget.USERS,

            bucket:
              STORAGE_BUCKET,
          }
        );

      /**
       * Misol:
       *
       * users/avatar.png
       */
      setForm((previous) => ({
        ...previous,
        avatarUrl:
          uploadedFile.storagePath,
      }));

      toast.success(
        t("toast.imageUploaded")
      );
    } catch (error) {
      clearLocalPreview();

      /**
       * Upload ishlamasa eski rasm qaytariladi.
       */
      setForm((previous) => ({
        ...previous,
        avatarUrl:
          profileData?.avatarUrl ||
          "",
      }));

      toast.error(
        error instanceof Error
          ? error.message
          : t("toast.imageUploadFailed")
      );
    } finally {
      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      uploadMutation.isPending
    ) {
      toast.warning(
        t("toast.imageStillUploading")
      );

      return;
    }

    try {
      await updateMutation.mutateAsync(
        {
          firstName:
            form.firstName.trim(),

          lastName:
            form.lastName.trim(),

          phoneNumber:
            form.phoneNumber.trim(),

          /**
           * Backendga:
           *
           * users/avatar.png
           *
           * yuboriladi.
           */
          avatarUrl:
            form.avatarUrl,
        }
      );

      toast.success(
        t("toast.profileUpdated")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("toast.profileUpdateFailed")
      );
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const initials =
    getInitials(
      form.firstName,
      form.lastName,
      profileData?.email
    );

  const displayName =
    [
      form.firstName,
      form.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "—";

  /**
   * Upload vaqtida local preview,
   * uploaddan keyin backend rasmi.
   */
  const avatarSrc =
    localPreviewUrl ||
    avatarImage.url;

  const isAvatarLoading =
    uploadMutation.isPending ||
    Boolean(
      form.avatarUrl &&
        !avatarSrc &&
        avatarImage.isFetching
    );

  const isSaveDisabled =
    updateMutation.isPending ||
    uploadMutation.isPending;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center gap-4 px-4 py-5 sm:gap-6 sm:px-8 sm:py-7">
          <div className="relative shrink-0">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600 shadow-md ring-4 ring-white sm:h-20 sm:w-20">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={t("avatarAlt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black sm:text-2xl">
                  {initials}
                </span>
              )}

              {isAvatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                  <DentalLoaderIcon size={22} className="text-white" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploadMutation.isPending
              }
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              title={t("changePhoto")}
            >
              <Camera size={13} />
            </button>

            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={
                handleImageChange
              }
              disabled={
                uploadMutation.isPending
              }
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-slate-900 sm:text-3xl">
              {displayName}
            </h1>

            <p className="mt-0.5 truncate text-sm text-slate-500">
              {profileData?.email}
            </p>

            {profileData?.roles
              ?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profileData.roles.map(
                  (role) => (
                    <span
                      key={role}
                      className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700"
                    >
                      {formatRole(
                        role
                      )}
                    </span>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileInput
              label={t("firstName")}
              icon={
                <User size={16} />
              }
              value={
                form.firstName
              }
              onChange={(value) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    firstName:
                      value,
                  })
                )
              }
              disabled={
                updateMutation.isPending
              }
              placeholderDash={t("placeholderDash")}
              enterFieldPlaceholder={t("enterFieldPlaceholder", { field: t("firstName").toLowerCase() })}
            />

            <ProfileInput
              label={t("lastName")}
              icon={
                <User size={16} />
              }
              value={
                form.lastName
              }
              onChange={(value) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    lastName:
                      value,
                  })
                )
              }
              disabled={
                updateMutation.isPending
              }
              placeholderDash={t("placeholderDash")}
              enterFieldPlaceholder={t("enterFieldPlaceholder", { field: t("lastName").toLowerCase() })}
            />
          </div>

          <ProfileInput
            label={t("phone")}
            icon={
              <Phone size={16} />
            }
            value={
              form.phoneNumber
            }
            onChange={(value) =>
              setForm(
                (previous) => ({
                  ...previous,
                  phoneNumber:
                    value,
                })
              )
            }
            type="tel"
            disabled={
              updateMutation.isPending
            }
            placeholderDash={t("placeholderDash")}
            enterFieldPlaceholder={t("enterFieldPlaceholder", { field: t("phone").toLowerCase() })}
          />

          <ProfileInput
            label={t("email")}
            icon={
              <Mail size={16} />
            }
            value={
              profileData?.email ||
              ""
            }
            disabled
            placeholderDash={t("placeholderDash")}
            enterFieldPlaceholder={t("enterFieldPlaceholder", { field: t("email").toLowerCase() })}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isSaveDisabled
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {updateMutation.isPending ? (
                <>
                  <DentalLoaderIcon size={16} />

                  {t("submit.saving")}
                </>
              ) : uploadMutation.isPending ? (
                <>
                  <DentalLoaderIcon size={16} />

                  {t("submit.uploadingImage")}
                </>
              ) : (
                <>
                  <Save size={16} />

                  {t("submit.saveChanges")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}