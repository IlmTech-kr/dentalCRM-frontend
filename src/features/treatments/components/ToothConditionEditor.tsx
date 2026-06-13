"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Plus } from "lucide-react";

import { ToothCondition } from "@/src/lib/enums/enums.types";
import type { ToothMap } from "@/src/types/dental-chart.types";

const diagnosisOptions: ToothCondition[] = [
  ToothCondition.CARIES,
  ToothCondition.PULPITIS,
  ToothCondition.GINGIVITIS,
  ToothCondition.CRACK,
];

const stateOptions: ToothCondition[] = [
  ToothCondition.HEALTHY,
  ToothCondition.MISSING,
  ToothCondition.EXTRACTED,
  ToothCondition.FILLING,
  ToothCondition.CROWN,
  ToothCondition.IMPLANT,
  ToothCondition.BRIDGE,
  ToothCondition.ROOT_CANAL,
];

const conditionLabels: Record<ToothCondition, string> = {
  [ToothCondition.HEALTHY]: "Sog‘lom",
  [ToothCondition.CARIES]: "Karies",
  [ToothCondition.EXTRACTED]: "Sug‘urilgan",
  [ToothCondition.PULPITIS]: "Pulpit",
  [ToothCondition.FILLING]: "Plomba",
  [ToothCondition.CROWN]: "Koronka",
  [ToothCondition.IMPLANT]: "Implant",
  [ToothCondition.MISSING]: "Yo‘q",
  [ToothCondition.CRACK]: "Yoriq",
  [ToothCondition.BRIDGE]: "Ko‘prik",
  [ToothCondition.ROOT_CANAL]: "Kanal davolangan",
  [ToothCondition.GINGIVITIS]: "Gingivit",
};

type Props = {
  toothMap: ToothMap;
  setToothMap: Dispatch<SetStateAction<ToothMap>>;
};

export function ToothConditionEditor({ setToothMap }: Props) {
  const [toothNumber, setToothNumber] = useState("16");
  const [diagnosis, setDiagnosis] = useState<ToothCondition | "">(
    ToothCondition.CARIES,
  );
  const [state, setState] = useState<ToothCondition | "">("");
  const [note, setNote] = useState("Chaynash yuzasida chuqur karies bor");

  function addTooth() {
    const normalizedToothNumber = toothNumber.trim();

    if (!normalizedToothNumber) {
      alert("Tish raqamini kiriting");
      return;
    }

    setToothMap((prev) => ({
      ...prev,
      [normalizedToothNumber]: {
        diagnoses: diagnosis ? [diagnosis] : [],
        states: state ? [state] : [],
        note: note.trim(),
      },
    }));

    setToothNumber("");
    setDiagnosis(ToothCondition.CARIES);
    setState("");
    setNote("");
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-1 font-black text-slate-900">
        Tish holatini kiritish
      </h3>

      <p className="mb-5 text-sm text-slate-500">
        Tish raqami, tashxis, holat va doctor note kiriting.
      </p>

      <div className="space-y-4">
        <FormField label="Tish raqami">
          <input
            value={toothNumber}
            onChange={(e) => setToothNumber(e.target.value)}
            placeholder="16"
            className="input-ui"
          />
        </FormField>

        <FormField label="Diagnosis">
          <select
            value={diagnosis}
            onChange={(e) =>
              setDiagnosis(e.target.value as ToothCondition | "")
            }
            className="input-ui"
          >
            <option value="">Yo‘q</option>

            {diagnosisOptions.map((item) => (
              <option key={item} value={item}>
                {conditionLabels[item]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="State">
          <select
            value={state}
            onChange={(e) => setState(e.target.value as ToothCondition | "")}
            className="input-ui"
          >
            <option value="">Yo‘q</option>

            {stateOptions.map((item) => (
              <option key={item} value={item}>
                {conditionLabels[item]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Doctor note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="input-ui resize-none"
          />
        </FormField>

        <button
          type="button"
          onClick={addTooth}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tooth mapga qo‘shish
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}