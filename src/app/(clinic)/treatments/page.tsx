"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Dental3DChart } from "@/src/features/treatments/components/Dental3DChart";

import {
  useChartByPatientId,
  useCreateChart,
  useDeleteChart,
  useUpdateChart,
} from "@/src/features/treatments/hooks/useTreatments";

import type {
  ToothDiagnosis,
  ToothItem,
  ToothMap,
  ToothState,
} from "@/src/types/treatment.types";

const DIAGNOSES: ToothDiagnosis[] = [
  "CARIES",
  "PULPITIS",
  "PERIODONTITIS",
  "GINGIVITIS",
  "ABSCESS",
];

const STATES: ToothState[] = [
  "MISSING",
  "FILLING",
  "CROWN",
  "IMPLANT",
  "ROOT_CANAL",
];

const diagnosisLabels: Record<string, string> = {
  CARIES: "Karies",
  PULPITIS: "Pulpit",
  PERIODONTITIS: "Periodontit",
  GINGIVITIS: "Gingivit",
  ABSCESS: "Abssess",
};

const stateLabels: Record<string, string> = {
  MISSING: "Yo‘q",
  FILLING: "Plomba",
  CROWN: "Koronka",
  IMPLANT: "Implant",
  ROOT_CANAL: "Kanal davolangan",
};

function emptyTooth(): ToothItem {
  return {
    diagnoses: [],
    states: [],
    note: "",
  };
}

export default function TreatmentsPage() {
  const [patientId, setPatientId] = useState("");
  const [searchedPatientId, setSearchedPatientId] = useState("");
  const [selectedTooth, setSelectedTooth] = useState("16");
  const [localToothMap, setLocalToothMap] = useState<ToothMap>({});

  const {
    data: chart,
    isLoading,
    isError,
    refetch,
  } = useChartByPatientId(searchedPatientId);

  const createChartMutation = useCreateChart();
  const updateChartMutation = useUpdateChart();
  const deleteChartMutation = useDeleteChart();

  const activeTooth = localToothMap[selectedTooth] || emptyTooth();

  const totalSelectedTeeth = useMemo(() => {
    return Object.values(localToothMap).filter(
      (item) => item.diagnoses.length || item.states.length || item.note
    ).length;
  }, [localToothMap]);

  const isSaving =
    createChartMutation.isPending || updateChartMutation.isPending;

  function handleSearch() {
    const value = patientId.trim();

    if (!value) {
      alert("Patient ID kiriting");
      return;
    }

    setSearchedPatientId(value);

    setTimeout(() => {
      refetch();
    }, 0);
  }

  function loadChartToLocal() {
    if (!chart?.toothMap) return;
    setLocalToothMap(chart.toothMap);
  }

  function handleSelectTooth(toothNumber: string) {
    setSelectedTooth(toothNumber);

    setLocalToothMap((prev) => ({
      ...prev,
      [toothNumber]: prev[toothNumber] || emptyTooth(),
    }));
  }

  function updateSelectedTooth(next: Partial<ToothItem>) {
    setLocalToothMap((prev) => {
      const current = prev[selectedTooth] || emptyTooth();

      return {
        ...prev,
        [selectedTooth]: {
          ...current,
          ...next,
        },
      };
    });
  }

  function handleClearTooth() {
    setLocalToothMap((prev) => {
      const next = { ...prev };
      delete next[selectedTooth];
      return next;
    });
  }

  function handleSave() {
    if (!searchedPatientId.trim()) {
      alert("Avval patientId kiriting va qidiring");
      return;
    }

    if (!Object.keys(localToothMap).length) {
      alert("Kamida bitta tish tanlang");
      return;
    }

    const payload = {
      patientId: searchedPatientId.trim(),
      toothMap: localToothMap,
    };

    if (chart?._id) {
      updateChartMutation.mutate({
        chartId: chart._id,
        payload,
      });

      return;
    }

    createChartMutation.mutate(payload);
  }

  function handleDelete() {
    if (!chart?._id) return;

    const confirmed = window.confirm(
      "Rostdan ham bu ko‘rik chartini o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    deleteChartMutation.mutate(chart._id, {
      onSuccess: () => {
        setLocalToothMap({});
        setSearchedPatientId("");
        setPatientId("");
      },
    });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Activity size={16} />
              Dental Ko‘rik
            </div>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Bemor tish xaritasi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              3D model orqali tishni tanlang, diagnoz va holatini belgilang.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative flex-1 lg:w-[420px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Patient ID kiriting..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <button
              onClick={handleSearch}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Search size={18} />
              Qidirish
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Chart status</p>

            <div className="mt-2 flex items-center gap-2">
              {chart?._id ? (
                <>
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span className="font-bold text-slate-900">Mavjud</span>
                </>
              ) : (
                <>
                  <Plus className="text-blue-500" size={20} />
                  <span className="font-bold text-slate-900">Yangi</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Belgilangan tishlar</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalSelectedTeeth}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tanlangan tish</p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              #{selectedTooth}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <Loader2 className="animate-spin text-blue-600" size={36} />
          </div>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
            <div className="space-y-4">
              {isError && searchedPatientId ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
                  Bu bemor uchun chart topilmadi. Yangi chart yaratishingiz
                  mumkin.
                </div>
              ) : null}

              {chart?.toothMap ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Oldingi chart topildi
                    </p>

                    <p className="text-sm text-blue-700">
                      Chart ID: {chart._id}
                    </p>
                  </div>

                  <button
                    onClick={loadChartToLocal}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Chartni yuklash
                  </button>
                </div>
              ) : null}

              <Dental3DChart
                selectedTooth={selectedTooth}
                toothMap={localToothMap}
                onSelectTooth={handleSelectTooth}
              />
            </div>

            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Tish #{selectedTooth}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Diagnoz va holatni tanlang.
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Edit3 size={22} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="diagnosis"
                    className="mb-3 block text-sm font-bold text-slate-800"
                  >
                    Diagnoz
                  </label>

                  <select
                    id="diagnosis"
                    value={activeTooth.diagnoses[0] || ""}
                    onChange={(event) =>
                      updateSelectedTooth({
                        diagnoses: event.target.value
                          ? [event.target.value as ToothDiagnosis]
                          : [],
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Diagnoz tanlang</option>

                    {DIAGNOSES.map((diagnosis) => (
                      <option key={diagnosis} value={diagnosis}>
                        {diagnosisLabels[diagnosis] || diagnosis}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-3 block text-sm font-bold text-slate-800"
                  >
                    Tish holati
                  </label>

                  <select
                    id="state"
                    value={activeTooth.states[0] || ""}
                    onChange={(event) =>
                      updateSelectedTooth({
                        states: event.target.value
                          ? [event.target.value as ToothState]
                          : [],
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Holat tanlang</option>

                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {stateLabels[state] || state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="note"
                    className="mb-3 block text-sm font-bold text-slate-800"
                  >
                    Shifokor izohi
                  </label>

                  <textarea
                    id="note"
                    value={activeTooth.note}
                    onChange={(event) =>
                      updateSelectedTooth({
                        note: event.target.value,
                      })
                    }
                    placeholder="Masalan: Chaynash yuzasida chuqur karies bor..."
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    Tanlangan qiymatlar
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between gap-3">
                      <span>Diagnoz:</span>
                      <span className="font-semibold text-slate-900">
                        {activeTooth.diagnoses[0]
                          ? diagnosisLabels[activeTooth.diagnoses[0]] ||
                            activeTooth.diagnoses[0]
                          : "Tanlanmagan"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Holat:</span>
                      <span className="font-semibold text-slate-900">
                        {activeTooth.states[0]
                          ? stateLabels[activeTooth.states[0]] ||
                            activeTooth.states[0]
                          : "Tanlanmagan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClearTooth}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <X size={18} />
                    Tozalash
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Saqlash
                  </button>
                </div>

                {chart?._id ? (
                  <button
                    onClick={handleDelete}
                    disabled={deleteChartMutation.isPending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteChartMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Chartni o‘chirish
                  </button>
                ) : null}
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}