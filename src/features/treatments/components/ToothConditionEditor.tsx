"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
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

const conditionKeys: Record<ToothCondition, string> = {
  [ToothCondition.HEALTHY]: "healthy",
  [ToothCondition.CARIES]: "caries",
  [ToothCondition.EXTRACTED]: "extracted",
  [ToothCondition.PULPITIS]: "pulpitis",
  [ToothCondition.FILLING]: "filling",
  [ToothCondition.CROWN]: "crown",
  [ToothCondition.IMPLANT]: "implant",
  [ToothCondition.MISSING]: "missing",
  [ToothCondition.CRACK]: "crack",
  [ToothCondition.BRIDGE]: "bridge",
  [ToothCondition.ROOT_CANAL]: "rootCanal",
  [ToothCondition.GINGIVITIS]: "gingivitis",
};

type Props = {
  toothMap: ToothMap;
  setToothMap: Dispatch<SetStateAction<ToothMap>>;
};

export function ToothConditionEditor({ setToothMap }: Props) {
  const t = useTranslations("treatments");
  const [toothNumber, setToothNumber] = useState("16");
  const [diagnosis, setDiagnosis] = useState<ToothCondition | "">(
    ToothCondition.CARIES,
  );
  const [state, setState] = useState<ToothCondition | "">("");
  const [note, setNote] = useState(t("toothConditionEditor.defaultNote"));

  const conditionLabel = (condition: ToothCondition) =>
    t(`toothConditions.${conditionKeys[condition]}` as any);

  function addTooth() {
    const normalizedToothNumber = toothNumber.trim();

    if (!normalizedToothNumber) {
      alert(t("toothConditionEditor.alertToothNumberRequired"));
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
        {t("toothConditionEditor.title")}
      </h3>

      <p className="mb-5 text-sm text-slate-500">
        {t("toothConditionEditor.subtitle")}
      </p>

      <div className="space-y-4">
        <FormField label={t("toothConditionEditor.toothNumberLabel")}>
          <input
            value={toothNumber}
            onChange={(e) => setToothNumber(e.target.value)}
            placeholder="16"
            className="input-ui"
          />
        </FormField>

        <FormField label={t("toothConditionEditor.diagnosisLabel")}>
          <select
            value={diagnosis}
            onChange={(e) =>
              setDiagnosis(e.target.value as ToothCondition | "")
            }
            className="input-ui"
          >
            <option value="">{t("toothConditionEditor.none")}</option>

            {diagnosisOptions.map((item) => (
              <option key={item} value={item}>
                {conditionLabel(item)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t("toothConditionEditor.stateLabel")}>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as ToothCondition | "")}
            className="input-ui"
          >
            <option value="">{t("toothConditionEditor.none")}</option>

            {stateOptions.map((item) => (
              <option key={item} value={item}>
                {conditionLabel(item)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t("toothConditionEditor.noteLabel")}>
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
          {t("toothConditionEditor.addButton")}
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