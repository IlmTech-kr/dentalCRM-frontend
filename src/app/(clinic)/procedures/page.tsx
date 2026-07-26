"use client";

/**
 * File: src/app/(clinic)/procedures/page.tsx
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  Edit3,
  Loader2,
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

import { useDentalProcedures } from "@/src/features/treatments/hooks/useDentalProcedures";
import { useToast } from "@/src/lib/hooks/Usetoast";
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
  return new Intl.NumberFormat("uz-UZ").format(Number(value || 0)) + " so'm";
}

function getConditionStyle(condition?: ResultingCondition | string) {
  switch (condition) {
    case ToothCondition.FILLING: return "bg-blue-50 text-blue-700 ring-blue-100";
    case ToothCondition.CROWN: return "bg-purple-50 text-purple-700 ring-purple-100";
    case ToothCondition.IMPLANT: return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case ToothCondition.ROOT_CANAL: return "bg-orange-50 text-orange-700 ring-orange-100";
    case ToothCondition.EXTRACTED: return "bg-red-50 text-red-700 ring-red-100";
    case ToothCondition.MISSING: return "bg-slate-100 text-slate-700 ring-slate-200";
    default: return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getConditionLabel(
  condition: ResultingCondition | string | undefined,
  t: ReturnType<typeof useTranslations>
) {
  switch (condition) {
    case ToothCondition.FILLING: return t("conditions.filling");
    case ToothCondition.CROWN: return t("conditions.crown");
    case ToothCondition.IMPLANT: return t("conditions.implant");
    case ToothCondition.ROOT_CANAL: return t("conditions.rootCanal");
    case ToothCondition.EXTRACTED: return t("conditions.extracted");
    case ToothCondition.MISSING: return t("conditions.missing");
    default: return condition || "-";
  }
}

export default function ProceduresPage() {
  const t = useTranslations("procedures");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<DentalProcedure | null>(null);
  const [form, setForm] = useState<CreateDentalProcedureDto>(emptyForm);

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
      (sum: number, item: DentalProcedure) => sum + Number(item.defaultPrice || 0),
      0
    );
  }, [procedures]);

  const isSaving = isCreating || isUpdating;

  function openCreateModal() {
    setEditingProcedure(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(procedure: DentalProcedure) {
    setEditingProcedure(procedure);
    setForm({
      code: procedure.code || "",
      name: procedure.name || "",
      defaultPrice: Number(procedure.defaultPrice || 0),
      resultingCondition: procedure.resultingCondition || ToothCondition.FILLING,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    setEditingProcedure(null);
    setForm(emptyForm);
    setIsModalOpen(false);
  }

  async function handleSubmit() {
    if (!form.code.trim()) {
      toast.warning(t("toast.codeRequired"));
      return;
    }

    if (!form.name.trim()) {
      toast.warning(t("toast.nameRequired"));
      return;
    }

    if (!Number(form.defaultPrice)) {
      toast.warning(t("toast.priceRequired"));
      return;
    }

    const payload: CreateDentalProcedureDto | UpdateDentalProcedureDto = {
      code: form.code.trim(),
      name: form.name.trim(),
      defaultPrice: Number(form.defaultPrice),
      resultingCondition: form.resultingCondition,
    };

    try {
      if (editingProcedure) {
        const procedureId = getId(editingProcedure);

        if (!procedureId) {
          toast.error(t("toast.idNotFound"));
          return;
        }

        await updateProcedure({ procedureId, payload });
        toast.success(t("toast.updateSuccess"));
      } else {
        await createProcedure(payload);
        toast.success(t("toast.createSuccess"));
      }

      closeModal();
    } catch (error) {
      toast.error(t("toast.saveError"));
    }
  }

  async function handleDelete(procedure: DentalProcedure) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      toast.error(t("toast.idNotFound"));
      return;
    }

    /**
     * confirm() o'rniga window.confirm — bu blocking.
     * Keyinchalik ConfirmModal componentga o'tkazish mumkin.
     */
    const ok = window.confirm(t("deleteConfirm.message", { name: procedure.name }));
    if (!ok) return;

    try {
      await deleteProcedure(procedureId);
      toast.success(t("toast.deleteSuccess"));
    } catch {
      toast.error(t("toast.deleteError"));
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-0 right-40 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
                <BadgeDollarSign size={18} />
                {t("header.badge")}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{t("header.title")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t("header.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus size={18} />
              {t("header.addButton")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{t("stats.totalProcedures")}</p>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><FileText size={20} /></div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">{procedures.length}</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{t("stats.totalDefaultPrice")}</p>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><CircleDollarSign size={20} /></div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatMoney(totalPrice)}</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{t("stats.status")}</p>
              <div className="rounded-2xl bg-purple-50 p-3 text-purple-600"><Activity size={20} /></div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600">{tCommon("status.active")}</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">{t("list.sectionTitle")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("list.sectionSubtitle")}</p>
            </div>

            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("list.searchPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 md:w-[340px]"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">{t("table.code")}</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">{t("table.name")}</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">{t("table.price")}</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">{t("table.result")}</th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">{t("table.actionsHeader")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500">
                        <Loader2 size={18} className="animate-spin" />
                        {t("list.loading")}
                      </div>
                    </td>
                  </tr>
                ) : procedures.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                        <Search size={24} />
                      </div>
                      <p className="mt-4 font-black text-slate-950">{t("list.emptyTitle")}</p>
                      <p className="mt-1 text-sm text-slate-500">{t("list.emptySubtitle")}</p>
                    </td>
                  </tr>
                ) : (
                  procedures.map((procedure: DentalProcedure) => (
                    <tr key={getId(procedure)} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                          {procedure.code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-950">{procedure.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-blue-700">
                        {formatMoney(procedure.defaultPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(procedure.resultingCondition)}`}>
                          {getConditionLabel(procedure.resultingCondition, t)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(procedure)}
                            className="rounded-2xl p-2.5 text-blue-600 transition hover:bg-blue-50"
                            title={tCommon("actions.edit")}
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(procedure)}
                            disabled={isDeleting}
                            className="rounded-2xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            title={tCommon("actions.delete")}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            aria-label={t("modal.closeAria")}
          />

          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-2xl shadow-slate-950/20">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white ring-1 ring-white/20">
                    <Sparkles size={15} />
                    {editingProcedure ? t("modal.editBadge") : t("modal.createBadge")}
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight">
                    {editingProcedure ? t("modal.editTitle") : t("modal.createTitle")}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-blue-50">
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

            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">{t("modal.codeLabel")}</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder={t("modal.codePlaceholder")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">{t("modal.priceLabel")}</label>
                  <input
                    type="number"
                    value={form.defaultPrice === 0 ? "" : form.defaultPrice}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        defaultPrice: raw === "" ? 0 : Number(raw),
                      }));
                    }}
                    placeholder={t("modal.pricePlaceholder")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">{t("modal.nameLabel")}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("modal.namePlaceholder")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">{t("modal.conditionLabel")}</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {RESULTING_CONDITIONS.map((condition) => {
                    const active = form.resultingCondition === condition;
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, resultingCondition: condition }))}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {getConditionLabel(condition, t)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t("modal.previewLabel")}</p>
                <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{form.name || t("modal.previewNamePlaceholder")}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{form.code || t("modal.previewCodePlaceholder")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(form.resultingCondition)}`}>
                      {getConditionLabel(form.resultingCondition, t)}
                    </span>
                    <span className="text-sm font-black text-blue-700">
                      {formatMoney(Number(form.defaultPrice))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {t("modal.cancelButton")}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editingProcedure ? t("modal.updateButton") : t("modal.createButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}