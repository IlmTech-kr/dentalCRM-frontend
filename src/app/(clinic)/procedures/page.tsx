"use client";

import { useMemo, useState } from "react";
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

function getConditionLabel(condition?: ResultingCondition | string) {
  switch (condition) {
    case ToothCondition.FILLING:
      return "Plomba";
    case ToothCondition.CROWN:
      return "Koronka";
    case ToothCondition.IMPLANT:
      return "Implant";
    case ToothCondition.ROOT_CANAL:
      return "Kanal davolash";
    case ToothCondition.EXTRACTED:
      return "Sug‘urilgan";
    case ToothCondition.MISSING:
      return "Yo‘q";
    default:
      return condition || "-";
  }
}

export default function ProceduresPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] =
    useState<DentalProcedure | null>(null);

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
      (sum: number, item: DentalProcedure) =>
        sum + Number(item.defaultPrice || 0),
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
      resultingCondition:
        procedure.resultingCondition || ToothCondition.FILLING,
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
      alert("Procedure code kiriting");
      return;
    }

    if (!form.name.trim()) {
      alert("Procedure nomini kiriting");
      return;
    }

    if (!Number(form.defaultPrice)) {
      alert("Procedure narxini kiriting");
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
          alert("Procedure ID topilmadi");
          return;
        }

        await updateProcedure({
          procedureId,
          payload,
        });
      } else {
        await createProcedure(payload);
      }

      closeModal();
    } catch (error) {
      console.error(error);
      alert(
        "Procedure saqlashda xatolik. Create/update faqat CLINIC_ADMIN role bilan ishlashi mumkin."
      );
    }
  }

  async function handleDelete(procedure: DentalProcedure) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      alert("Procedure ID topilmadi");
      return;
    }

    const ok = confirm(`"${procedure.name}" procedureni o'chirasizmi?`);

    if (!ok) return;

    try {
      await deleteProcedure(procedureId);
    } catch (error) {
      console.error(error);
      alert(
        "Procedure o'chirishda xatolik. Delete faqat CLINIC_ADMIN role bilan ishlashi mumkin."
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-0 right-40 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
                <BadgeDollarSign size={18} />
                Dental Service narxlar listi
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Procedures
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Bu sahifada klinika xizmatlari va narxlari boshqariladi.
                Treatment visit ichida doctor shu listdan procedure tanlaydi.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus size={18} />
              Yangi procedure
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                Jami procedures
              </p>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
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
                Umumiy default narx
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
              <p className="text-sm font-bold text-slate-500">Status</p>
              <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
                <Activity size={20} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600">Active</p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Procedure list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu ro‘yxat treatment visitda tanlash uchun ishlatiladi.
              </p>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Procedure qidirish..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 md:w-[340px]"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Code
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Nomi
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Narxi
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    Natija
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Amallar
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500">
                        <Loader2 size={18} className="animate-spin" />
                        Loading procedures...
                      </div>
                    </td>
                  </tr>
                ) : procedures.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                        <Search size={24} />
                      </div>
                      <p className="mt-4 font-black text-slate-950">
                        Procedure topilmadi
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Yangi procedure yarating yoki searchni tozalang.
                      </p>
                    </td>
                  </tr>
                ) : (
                  procedures.map((procedure: DentalProcedure) => (
                    <tr
                      key={getId(procedure)}
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

                      <td className="px-5 py-4 text-sm font-black text-blue-700">
                        {formatMoney(procedure.defaultPrice)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(
                            procedure.resultingCondition
                          )}`}
                        >
                          {getConditionLabel(procedure.resultingCondition)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(procedure)}
                            className="rounded-2xl p-2.5 text-blue-600 transition hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(procedure)}
                            disabled={isDeleting}
                            className="rounded-2xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            aria-label="Close modal"
          />

          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-2xl shadow-slate-950/20">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white ring-1 ring-white/20">
                    <Sparkles size={15} />
                    {editingProcedure ? "Edit mode" : "Create mode"}
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight">
                    {editingProcedure
                      ? "Procedure update qilish"
                      : "Yangi procedure yaratish"}
                  </h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-blue-50">
                    Procedure narxi va natija conditionini kiriting. Bu service
                    keyinchalik treatment visit ichida tanlanadi.
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
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Procedure code
                  </label>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        code: event.target.value,
                      }))
                    }
                    placeholder="PROC_002"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Default price
                  </label>
                  <input
                    type="number"
                    value={form.defaultPrice}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        defaultPrice: Number(event.target.value),
                      }))
                    }
                    placeholder="550000"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Procedure nomi
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Doimiy yorug'likli kompozit plomba"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Resulting condition
                </label>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {RESULTING_CONDITIONS.map((condition) => {
                    const active = form.resultingCondition === condition;

                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            resultingCondition: condition,
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {getConditionLabel(condition)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Preview
                </p>

                <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {form.name || "Procedure nomi"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {form.code || "PROC_CODE"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getConditionStyle(
                        form.resultingCondition
                      )}`}
                    >
                      {getConditionLabel(form.resultingCondition)}
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
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}

                {editingProcedure ? "Update qilish" : "Create qilish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}