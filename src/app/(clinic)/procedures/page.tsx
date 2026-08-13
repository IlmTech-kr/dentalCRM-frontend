"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  Sparkles,
  FileText,
  CircleDollarSign,
  Activity,
} from "lucide-react";

import DentalLoader, {
  DentalLoaderIcon,
} from "@/src/components/ui/DentalLoader";

import { useDentalProcedures } from "@/src/features/treatments/hooks/useDentalProcedures";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { getApiErrorMessage } from "@/src/lib/api/http";

import type {
  CreateDentalProcedureDto,
  DentalProcedure,
  ResultingCondition,
  UpdateDentalProcedureDto,
} from "@/src/types/dental-procedure.types";

import { ToothCondition } from "@/src/lib/enums/enums.types";

const RESULTING_CONDITIONS: ResultingCondition[] = [
  ToothCondition.FILLING,
  ToothCondition.CROWN,
  ToothCondition.IMPLANT,
  ToothCondition.ROOT_CANAL,
  ToothCondition.EXTRACTED,
  ToothCondition.MISSING,
];

const emptyForm: CreateDentalProcedureDto = {
  code: "",
  name: "",
  defaultPrice: 0,
  resultingCondition: ToothCondition.FILLING,
};

function getId(item?: { id?: string; _id?: string } | null) {
  return item?.id || item?._id || "";
}

function formatMoney(value?: number) {
  return (
    new Intl.NumberFormat("uz-UZ").format(Number(value || 0)) + " so'm"
  );
}

/**
 * Generates a random alphanumeric string.
 */
function generateRandomCode(length = 6): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result = "";

  // Use crypto when available for better randomness.
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
      result += characters[values[i] % characters.length];
    }

    return result;
  }

  // Fallback.
  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return result;
}

/**
 * Generates a unique procedure code against currently loaded procedures.
 *
 * Example:
 * PROC-A7K92M
 */
function generateUniqueProcedureCode(
  procedures: DentalProcedure[]
): string {
  const existingCodes = new Set(
    procedures
      .map((procedure) => procedure.code?.trim().toUpperCase())
      .filter(Boolean)
  );

  let generatedCode = "";
  let attempts = 0;

  do {
    generatedCode = `PROC-${generateRandomCode(6)}`;
    attempts += 1;

    // Safety guard.
    if (attempts > 100) {
      generatedCode = `PROC-${Date.now()
        .toString(36)
        .toUpperCase()
        .slice(-6)}`;

      break;
    }
  } while (existingCodes.has(generatedCode));

  return generatedCode;
}

function getConditionStyle(
  condition?: ResultingCondition | string
) {
  switch (condition) {
    case ToothCondition.FILLING:
      return "bg-blue-50 text-blue-700 ring-blue-100";

    case ToothCondition.CROWN:
      return "bg-purple-50 text-purple-700 ring-purple-100";

    case ToothCondition.IMPLANT:
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";

    case ToothCondition.ROOT_CANAL:
      return "bg-orange-50 text-orange-700 ring-orange-100";

    case ToothCondition.EXTRACTED:
      return "bg-red-50 text-red-700 ring-red-100";

    case ToothCondition.MISSING:
      return "bg-slate-100 text-slate-700 ring-slate-200";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getConditionLabel(
  condition: ResultingCondition | string | undefined,
  t: ReturnType<typeof useTranslations>
) {
  switch (condition) {
    case ToothCondition.FILLING:
      return t("condition.filling");

    case ToothCondition.CROWN:
      return t("condition.crown");

    case ToothCondition.IMPLANT:
      return t("condition.implant");

    case ToothCondition.ROOT_CANAL:
      return t("condition.rootCanal");

    case ToothCondition.EXTRACTED:
      return t("condition.extracted");

    case ToothCondition.MISSING:
      return t("condition.missing");

    default:
      return condition || "-";
  }
}

export default function ProceduresPage() {
  const t = useTranslations("procedures");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingProcedure, setEditingProcedure] =
    useState<DentalProcedure | null>(null);

  const [form, setForm] =
    useState<CreateDentalProcedureDto>(emptyForm);

  const {
    procedures,
    isLoading,
    isFetching,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    isCreating,
    isUpdating,
    isDeleting,
  } = useDentalProcedures(search);

  const totalPrice = useMemo(() => {
    return procedures.reduce(
      (sum: number, item: DentalProcedure) =>
        sum + Number(item.defaultPrice || 0),
      0
    );
  }, [procedures]);

  const isSaving = isCreating || isUpdating;

  /**
   * Open create modal.
   */
  function openCreateModal() {
    setEditingProcedure(null);

    setForm({
      ...emptyForm,
    });

    setIsModalOpen(true);
  }

  /**
   * Open edit modal.
   */
  function openEditModal(procedure: DentalProcedure) {
    setEditingProcedure(procedure);

    setForm({
      code: procedure.code || "",
      name: procedure.name || "",
      defaultPrice: Number(procedure.defaultPrice || 0),
      resultingCondition:
        procedure.resultingCondition ||
        ToothCondition.FILLING,
    });

    setIsModalOpen(true);
  }

  /**
   * Close modal.
   */
  function closeModal() {
    if (isSaving) return;

    setEditingProcedure(null);

    setForm({
      ...emptyForm,
    });

    setIsModalOpen(false);
  }

  /**
   * Generate a unique procedure code.
   *
   * Example:
   * PROC-A7K92M
   */
  function handleGenerateCode() {
    const generatedCode =
      generateUniqueProcedureCode(procedures);

    setForm((prev) => ({
      ...prev,
      code: generatedCode,
    }));

    toast.success(
      "Procedure code generated successfully"
    );
  }

  /**
   * Submit create/update.
   */
  async function handleSubmit() {
    const procedureCode = form.code.trim().toUpperCase();
    const procedureName = form.name.trim();

    if (!procedureCode) {
      toast.warning(t("toast.enterCode"));
      return;
    }

    if (!procedureName) {
      toast.warning(t("toast.enterName"));
      return;
    }

    if (!Number(form.defaultPrice)) {
      toast.warning(t("toast.enterPrice"));
      return;
    }

    /**
     * Check duplicate code on frontend.
     *
     * When editing the same procedure,
     * its own existing code is ignored.
     */
    const duplicateProcedure = procedures.find(
      (procedure) => {
        const procedureId = getId(procedure);
        const editingId = getId(editingProcedure);

        return (
          procedure.code?.trim().toUpperCase() ===
            procedureCode &&
          procedureId !== editingId
        );
      }
    );

    if (duplicateProcedure) {
      toast.error(
        "This procedure code already exists. Please enter another code or generate a new one."
      );
      return;
    }

    const payload:
      | CreateDentalProcedureDto
      | UpdateDentalProcedureDto = {
      code: procedureCode,
      name: procedureName,
      defaultPrice: Number(form.defaultPrice),
      resultingCondition: form.resultingCondition,
    };

    try {
      if (editingProcedure) {
        const procedureId = getId(editingProcedure);

        if (!procedureId) {
          toast.error(t("toast.procedureIdNotFound"));
          return;
        }

        await updateProcedure({
          procedureId,
          payload,
        });

        toast.success(t("toast.updated"));
      } else {
        await createProcedure(payload);

        toast.success(t("toast.created"));
      }

      closeModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("toast.saveFailed")
        )
      );
    }
  }

  /**
   * Delete procedure.
   */
  async function handleDelete(
    procedure: DentalProcedure
  ) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      toast.error(t("toast.procedureIdNotFound"));
      return;
    }

    const ok = window.confirm(
      t("toast.deleteConfirm", {
        name: procedure.name,
      })
    );

    if (!ok) return;

    try {
      await deleteProcedure(procedureId);

      toast.success(t("toast.deleted"));
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("toast.deleteFailed")
        )
      );
    }
  }

  /**
   * Shared edit/delete action buttons — used by both the mobile card
   * list and the desktop table row.
   */
  function renderProcedureActionButtons(procedure: DentalProcedure) {
    return (
      <>
        <button
          type="button"
          onClick={() => openEditModal(procedure)}
          className="rounded-2xl p-2.5 text-primary-blue transition hover:bg-primary-blue/5"
          title={t("actions.edit")}
        >
          <Edit3 size={17} />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(procedure)}
          disabled={isDeleting}
          className="rounded-2xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          title={t("actions.delete")}
        >
          <Trash2 size={17} />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary-blue/10 blur-3xl" />
          <div className="absolute bottom-0 right-40 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-blue/5 px-4 py-2 text-sm font-extrabold text-primary-blue ring-1 ring-primary-blue/10">
                <BadgeDollarSign size={18} />
                {t("header.badge")}
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {t("header.title")}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t("header.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary-blue/20 transition hover:-translate-y-0.5 hover:bg-primary-blue-dark lg:w-auto"
            >
              <Plus size={18} />
              {t("header.addButton")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                {t("stats.total")}
              </p>

              <div className="rounded-2xl bg-primary-blue/5 p-3 text-primary-blue">
                <FileText size={20} />
              </div>
            </div>

            <p className="mt-3 text-3xl font-black text-slate-950">
              {procedures.length}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                {t("stats.totalPrice")}
              </p>

              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CircleDollarSign size={20} />
              </div>
            </div>

            <p className="mt-3 text-3xl font-black text-slate-950">
              {formatMoney(totalPrice)}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                {t("stats.status")}
              </p>

              <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
                <Activity size={20} />
              </div>
            </div>

            <p className="mt-3 text-3xl font-black text-emerald-600">
              {t("stats.active")}
            </p>
          </div>

        </div>

        {/* Table */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-black text-slate-950">
                {t("list.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("list.subtitle")}
              </p>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder={t("list.searchPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/5 md:w-[340px]"
              />
            </div>

          </div>

          {isLoading || isFetching ? (
            <div className="mt-6 rounded-3xl border border-slate-200 px-4 py-14 text-center">
              <DentalLoader fullScreen={false} text={t("list.loading")} />
            </div>
          ) : procedures.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 px-4 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Search size={24} />
              </div>
              <p className="mt-4 font-black text-slate-950">{t("list.empty")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("list.emptyHint")}</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="mt-6 space-y-3 md:hidden">
                {procedures.map((procedure: DentalProcedure) => (
                  <div key={getId(procedure)} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                          {procedure.code}
                        </span>
                        <p className="mt-2 text-sm font-black text-slate-950">{procedure.name}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {renderProcedureActionButtons(procedure)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-primary-blue">
                        {formatMoney(procedure.defaultPrice)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(
                          procedure.resultingCondition
                        )}`}
                      >
                        {getConditionLabel(procedure.resultingCondition, t)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="mt-6 hidden overflow-x-auto rounded-3xl border border-slate-200 md:block">

                <table className="w-full border-collapse text-left">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                        {t("table.code")}
                      </th>

                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                        {t("table.name")}
                      </th>

                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                        {t("table.price")}
                      </th>

                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                        {t("table.result")}
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                        {t("table.actions")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">

                    {procedures.map(
                      (procedure: DentalProcedure) => (
                        <tr
                          key={getId(procedure)}
                          data-entity-id={getId(procedure)}
                          className="transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-4">
                            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                              {procedure.code}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-950">
                              {procedure.name}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-black text-primary-blue">
                            {formatMoney(
                              procedure.defaultPrice
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(
                                procedure.resultingCondition
                              )}`}
                            >
                              {getConditionLabel(
                                procedure.resultingCondition,
                                t
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">
                              {renderProcedureActionButtons(procedure)}
                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            </>
          )}

        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">

          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            aria-label={tCommon("actions.close")}
          />

          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] border border-white/40 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl sm:rounded-[32px]">

            {/* Modal Header */}
            <div
              className="relative overflow-hidden px-4 py-6 text-white sm:px-6 sm:py-7"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-blue) 0%, color-mix(in srgb, var(--primary-blue) 70%, var(--primary-blue-dark)) 55%, var(--primary-blue-dark) 100%)",
              }}
            >

              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

              <div className="absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-primary-blue-dark/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">

                <div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white ring-1 ring-white/20">
                    <Sparkles size={15} />

                    {editingProcedure
                      ? t("modal.editModeBadge")
                      : t("modal.createModeBadge")}
                  </div>

                  <h2 className="mt-4 text-xl font-black tracking-tight sm:text-2xl">
                    {editingProcedure
                      ? t("modal.editTitle")
                      : t("modal.createTitle")}
                  </h2>

                  <p className="mt-2 max-w-lg break-words text-sm leading-6 text-white/70">
                    {t("modal.subtitle")}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-2xl bg-white/15 p-2 text-white transition hover:bg-white/25 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(92vh-150px)] space-y-5 overflow-y-auto p-4 sm:p-6">

              {/* Procedure Code */}
              <div>

                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t("modal.codeLabel")}
                </label>

                <div className="flex gap-2">

                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder={t("modal.codePlaceholder")}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/5"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isSaving}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-primary-blue/20 bg-primary-blue/5 px-4 py-3 text-sm font-black text-primary-blue transition hover:border-primary-blue/30 hover:bg-primary-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Generate unique procedure code"
                  >
                    <Sparkles size={17} />
                    Generate
                  </button>

                </div>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Enter your own procedure code or generate one automatically.
                </p>

              </div>

              {/* Price */}
              <div>

                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t("modal.priceLabel")}
                </label>

                <input
                  type="number"
                  value={
                    form.defaultPrice === 0
                      ? ""
                      : form.defaultPrice
                  }
                  onChange={(e) => {
                    const raw = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      defaultPrice:
                        raw === ""
                          ? 0
                          : Number(raw),
                    }));
                  }}
                  placeholder={t("modal.pricePlaceholder")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/5"
                />

              </div>

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t("modal.nameLabel")}
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder={t("modal.namePlaceholder")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/5"
                />

              </div>

              {/* Resulting Condition */}
              <div>

                <label className="mb-2 block text-sm font-black text-slate-700">
                  {t(
                    "modal.resultingConditionLabel"
                  )}
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">

                  {RESULTING_CONDITIONS.map(
                    (condition) => {
                      const active =
                        form.resultingCondition ===
                        condition;

                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              resultingCondition:
                                condition,
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                            active
                              ? "border-primary-blue bg-primary-blue text-white shadow-lg shadow-primary-blue/20"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-blue/20 hover:bg-primary-blue/5 hover:text-primary-blue"
                          }`}
                        >
                          {getConditionLabel(
                            condition,
                            t
                          )}
                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* Preview */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {t("modal.previewLabel")}
                </p>

                <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">

                  <div className="min-w-0">

                    <p className="break-words text-sm font-black text-slate-950">
                      {form.name ||
                        t(
                          "modal.previewNameFallback"
                        )}
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {form.code ||
                        t(
                          "modal.previewCodeFallback"
                        )}
                    </p>

                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(
                        form.resultingCondition
                      )}`}
                    >
                      {getConditionLabel(
                        form.resultingCondition,
                        t
                      )}
                    </span>

                    <span className="text-sm font-black text-primary-blue">
                      {formatMoney(
                        Number(form.defaultPrice)
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-4 py-5 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {t("modal.cancel")}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-blue/20 transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <DentalLoaderIcon size={18} />
                ) : (
                  <Save size={18} />
                )}

                {editingProcedure
                  ? t("modal.update")
                  : t("modal.create")}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
