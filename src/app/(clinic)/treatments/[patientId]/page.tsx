"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { tenantHttp } from "@/src/lib/api/http";
import { Dental3DChart } from "@/src/features/treatments/components/Dental3DChart";
import { useDentalChart } from "@/src/features/treatments/hooks/useDentalChart";
import { useDentalProcedures } from "@/src/features/treatments/hooks/useDentalProcedures";
import { useTreatmentCourses } from "@/src/features/treatments/hooks/useTreatmentCourses";

import type { ToothItem, ToothMap } from "@/src/types/dental-chart.types";

import { ToothCondition } from "@/src/lib/enums/enums.types";

import type { DentalProcedure } from "@/src/types/dental-procedure.types";
import type {
  TreatmentCourse,
  TreatmentVisitItem,
} from "@/src/types/treatment-course.types";

type TreatmentTab = "CHART" | "COURSE" | "VISIT";
type CourseStatusFilter = "ACTIVE" | "COMPLETED";

const DIAGNOSIS_OPTIONS: ToothCondition[] = [
  ToothCondition.CARIES,
  ToothCondition.PULPITIS,
  ToothCondition.GINGIVITIS,
  ToothCondition.CRACK,
];

const STATE_OPTIONS: ToothCondition[] = [
  ToothCondition.HEALTHY,
  ToothCondition.MISSING,
  ToothCondition.EXTRACTED,
  ToothCondition.FILLING,
  ToothCondition.CROWN,
  ToothCondition.IMPLANT,
  ToothCondition.BRIDGE,
  ToothCondition.ROOT_CANAL,
];

const diagnosisLabels: Record<ToothCondition, string> = {
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

const stateLabels: Record<ToothCondition, string> = {
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

function emptyToothItem(): ToothItem {
  return {
    diagnoses: [],
    states: [],
    note: "",
  };
}

function formatMoney(value?: number) {
  if (!value) return "0 so'm";
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

function formatVisitDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function getVisitTotal(visit: any) {
  if (typeof visit?.totalPrice === "number") return visit.totalPrice;
  if (typeof visit?.totalAmount === "number") return visit.totalAmount;
  if (typeof visit?.amount === "number") return visit.amount;

  return (visit?.items || []).reduce(
    (sum: number, item: any) => sum + Number(item?.price || item?.amount || 0),
    0,
  );
}

function getVisitDoctorName(visit: any) {
  const doctor = visit?.doctor || visit?.doctorInfo || visit?.doctorData;
  const doctorFullName = [doctor?.firstName, doctor?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    visit?.doctorName ||
    visit?.doctorFullName ||
    doctor?.fullName ||
    doctorFullName ||
    visit?.doctorId ||
    "-"
  );
}

function getId(item?: { id?: string; _id?: string } | null) {
  return item?.id || item?._id || "";
}

type PatientInfo = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  birthDate?: string;
  dateOfBirth?: string;
  lastVisit?: string;
  lastVisitDate?: string;
  status?: string;
  active?: boolean;
};

function getSubdomain(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("subDomain") || localStorage.getItem("subdomain") || ""
  );
}

function getHttp() {
  const subDomain = getSubdomain();

  if (!subDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found",
    };
  }

  return tenantHttp(subDomain);
}

function normalizePatient(response: any): PatientInfo {
  const data = response?.data?.data || response?.data || response;

  return {
    ...data,
    id: data?.id || data?._id,
  };
}

async function getPatientById(patientId: string): Promise<PatientInfo> {
  const http = getHttp();
  const response = await http.get(`/api/dental/patients/${patientId}`);

  return normalizePatient(response);
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return "—";

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "—";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age.toString();
}

function formatLastVisit(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) return "Bugun";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PatientInfoCard({
  patient,
  isLoading,
}: {
  patient?: PatientInfo;
  isLoading: boolean;
}) {
  const patientName = patient?.fullName
    ? patient.fullName
    : [patient?.firstName, patient?.lastName].filter(Boolean).join(" ");

  const phone = patient?.phoneNumber || patient?.phone || "—";
  const birthDate = patient?.birthDate || patient?.dateOfBirth;
  const age = calculateAge(birthDate);
  const lastVisit = formatLastVisit(
    patient?.lastVisitDate || patient?.lastVisit,
  );
  const isActive = patient?.active !== false && patient?.status !== "INACTIVE";

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-4">
            <div className="h-7 w-56 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5 lg:min-w-[260px]">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <UserRound className="h-14 w-14" strokeWidth={2.4} />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {patientName || "Bemor"}
            </h1>
            <p className="mt-1 text-lg font-black text-slate-950">{phone}</p>
          </div>
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 border-slate-200 xl:border-l xl:pl-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Yoshi</p>
              <p className="mt-1 text-lg font-black text-slate-950">{age}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-slate-200 xl:border-l xl:pl-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Oxirgi tashrif</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {lastVisit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-slate-200 xl:border-l xl:pl-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Holat</p>
              <span
                className={[
                  "mt-1 inline-flex rounded-xl px-3 py-1 text-sm font-black",
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TreatmentTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-sm transition",
        active
          ? "border-blue-200 bg-blue-600 text-white shadow-blue-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </button>
  );
}

export default function TreatmentPatientPage() {
  const params = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();

  const patientId = params.patientId;
  const appointmentId = searchParams.get("appointmentId") || "";

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientById(patientId),
    enabled: Boolean(patientId),
    staleTime: 1000 * 60,
  });

  const [activeTab, setActiveTab] = useState<TreatmentTab>("CHART");
  const [courseStatusFilter, setCourseStatusFilter] =
    useState<CourseStatusFilter>("ACTIVE");
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);

  const {
    chart,
    isLoading: chartLoading,
    createChart,
    updateChart,
    isCreating,
    isUpdating,
  } = useDentalChart(patientId);

  const {
    courses,
    isLoading: coursesLoading,
    createCourse,
    addVisit,
    completeCourse,
    isCreating: isCreatingCourse,
    isAddingVisit,
    isCompleting,
  } = useTreatmentCourses(patientId);

  const [procedureSearch, setProcedureSearch] = useState("");

  const {
    procedures,
    isLoading: proceduresLoading,
    isFetching: proceduresFetching,
  } = useDentalProcedures(procedureSearch);

  const [selectedTooth, setSelectedTooth] = useState("16");
  const [localToothMap, setLocalToothMap] = useState<ToothMap>({});

  const [mainDiagnosis, setMainDiagnosis] = useState("");
  const [selectedCourseTeeth, setSelectedCourseTeeth] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [doctorId, setDoctorId] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");

  const [visitDate, setVisitDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });

  const [visitItems, setVisitItems] = useState<TreatmentVisitItem[]>([]);

  const toothMap: ToothMap = useMemo(() => {
    return Object.keys(localToothMap).length > 0
      ? localToothMap
      : chart?.toothMap || {};
  }, [localToothMap, chart]);

  const selectedToothData = toothMap[selectedTooth] || emptyToothItem();

  const selectedCourse = courses.find(
    (course) => getId(course) === selectedCourseId,
  );

  const activeCourses = courses.filter(
    (course) => course.status !== "COMPLETED",
  );

  const completedCourses = courses.filter(
    (course) => course.status === "COMPLETED",
  );

  const visibleCourses =
    courseStatusFilter === "ACTIVE" ? activeCourses : completedCourses;

  const selectedHistoryCourse =
    visibleCourses.find((course) => getId(course) === selectedCourseId) ||
    visibleCourses[0] ||
    null;

  const selectedHistoryCourseId = selectedHistoryCourse
    ? getId(selectedHistoryCourse)
    : "";

  const selectedHistoryVisits = selectedHistoryCourse?.visits || [];

  const totalVisitPrice = visitItems.reduce((sum, item) => sum + item.price, 0);

  const chartProblemTeeth = useMemo(() => {
    return Object.entries(toothMap)
      .filter(([, item]) => {
        const hasDiagnosis = Boolean(item.diagnoses?.length);
        const hasState = Boolean(item.states?.length);
        const hasNote = Boolean(item.note?.trim());

        return hasDiagnosis || hasState || hasNote;
      })
      .map(([toothNumber, item]) => ({
        toothNumber,
        diagnosis: item.diagnoses?.[0] || "",
        state: item.states?.[0] || "",
        note: item.note || "",
      }))
      .sort((a, b) => Number(a.toothNumber) - Number(b.toothNumber));
  }, [toothMap]);

  const totalSelectedTeeth = chartProblemTeeth.length;

  const treatmentTeeth =
    selectedCourseTeeth.length > 0
      ? selectedCourseTeeth
      : chartProblemTeeth.map((item) => item.toothNumber);

  function getToothLabel(toothNumber: string) {
    const item = toothMap[toothNumber];

    if (!item) return `${toothNumber}-tish`;

    const diagnosis = item.diagnoses?.[0]
      ? diagnosisLabels[item.diagnoses[0] as ToothCondition] ||
        item.diagnoses[0]
      : "";

    const state = item.states?.[0]
      ? stateLabels[item.states[0] as ToothCondition] || item.states[0]
      : "";

    const details = [diagnosis, state].filter(Boolean).join(" • ");

    return details ? `${toothNumber}-tish — ${details}` : `${toothNumber}-tish`;
  }

  function buildCourseDiagnosis(teeth: string[]) {
    if (teeth.length === 0) return "";

    const teethText = teeth.map((tooth) => `${tooth}-tish`).join(", ");
    const diagnoses = teeth
      .map((tooth) => toothMap[tooth]?.diagnoses?.[0])
      .filter(Boolean);

    const uniqueDiagnoses = Array.from(new Set(diagnoses));
    const diagnosisText = uniqueDiagnoses.length
      ? uniqueDiagnoses
          .map(
            (diagnosis) =>
              diagnosisLabels[diagnosis as ToothCondition] || diagnosis,
          )
          .join(", ")
      : "davolanishi";

    return `${teethText} ${diagnosisText}`;
  }

  function handleToggleCourseTooth(toothNumber: string) {
    setSelectedCourseTeeth((prev) => {
      const exists = prev.includes(toothNumber);
      const next = exists
        ? prev.filter((item) => item !== toothNumber)
        : [...prev, toothNumber].sort((a, b) => Number(a) - Number(b));

      const autoDiagnosis = buildCourseDiagnosis(next);

      setMainDiagnosis((current) => {
        if (!current.trim()) return autoDiagnosis;
        return current;
      });

      if (next.length > 0) {
        setSelectedTooth(next[0]);
      }

      return next;
    });
  }

  function handleAutoFillDiagnosis() {
    setMainDiagnosis(buildCourseDiagnosis(selectedCourseTeeth));
  }

  function handleOpenCreateCourseModal() {
    const teethFromChart = chartProblemTeeth.map((item) => item.toothNumber);
    const teethToUse =
      selectedCourseTeeth.length > 0 ? selectedCourseTeeth : teethFromChart;

    if (selectedCourseTeeth.length === 0 && teethFromChart.length > 0) {
      setSelectedCourseTeeth(teethFromChart);
      setSelectedTooth(teethFromChart[0]);
    }

    if (!mainDiagnosis.trim() && teethToUse.length > 0) {
      setMainDiagnosis(buildCourseDiagnosis(teethToUse));
    }

    setIsCreateCourseModalOpen(true);
  }

  function handleSelectTooth(toothNumber: string) {
    setSelectedTooth(toothNumber);

    setLocalToothMap((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};

      return {
        ...base,
        [toothNumber]: base[toothNumber] || emptyToothItem(),
      };
    });
  }

  function updateSelectedTooth(next: Partial<ToothItem>) {
    setLocalToothMap((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
      const current = base[selectedTooth] || emptyToothItem();

      return {
        ...base,
        [selectedTooth]: {
          ...current,
          ...next,
        },
      };
    });
  }

  function handleClearTooth() {
    setLocalToothMap((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
      const next = { ...base };

      delete next[selectedTooth];

      return next;
    });
  }

  async function handleSaveChart() {
    if (!Object.keys(toothMap).length) {
      alert("Kamida bitta tish tanlang");
      return;
    }

    const payload = {
      patientId,
      toothMap,
    };

    if (chart && getId(chart)) {
      await updateChart({
        chartId: getId(chart),
        payload,
      });
    } else {
      await createChart(payload);
    }

    setLocalToothMap({});
    alert("Chart saqlandi");
  }

  function loadChartToLocal() {
    if (!chart?.toothMap) return;
    setLocalToothMap(chart.toothMap);
  }

  async function handleCreateCourse() {
    if (selectedCourseTeeth.length === 0) {
      alert("Avval chart bo‘yicha davolanadigan tishlarni tanlang");
      return;
    }

    const diagnosisText =
      mainDiagnosis.trim() || buildCourseDiagnosis(selectedCourseTeeth);

    if (!diagnosisText.trim()) {
      alert("Main diagnosis kiriting");
      return;
    }

    const created = await createCourse({
      patientId,
      mainDiagnosis: diagnosisText,
    });

    setMainDiagnosis("");
    setSelectedCourseId(getId(created));
    setSelectedTooth(selectedCourseTeeth[0]);
    setIsCreateCourseModalOpen(false);
    setActiveTab("VISIT");
  }

  function handleSelectCourse(course: TreatmentCourse) {
    setSelectedCourseId(getId(course));
  }

  function handleOpenAddVisitModal(course: TreatmentCourse) {
    if (course.status === "COMPLETED") {
      alert("Bu course completed bo‘lgan. Visit qo‘shib bo‘lmaydi.");
      return;
    }

    const courseId = getId(course);
    setSelectedCourseId(courseId);

    const firstTooth = treatmentTeeth[0] || chartProblemTeeth[0]?.toothNumber;
    if (firstTooth) {
      setSelectedTooth(firstTooth);
    }

    setIsAddVisitModalOpen(true);
  }

  function handleAddProcedure(procedure: DentalProcedure) {
    const procedureId = getId(procedure);

    if (!procedureId) {
      alert("Procedure ID topilmadi");
      return;
    }

    const exists = visitItems.some(
      (item) =>
        item.procedureId === procedureId && item.toothNumber === selectedTooth,
    );

    if (exists) {
      alert("Bu procedure allaqachon qo‘shilgan");
      return;
    }

    setVisitItems((prev) => [
      ...prev,
      {
        toothNumber: selectedTooth,
        procedureId,
        price: Number(procedure.defaultPrice || 0),
        completed: true,
        note: procedure.name,
      },
    ]);

    if (procedure.resultingCondition) {
      setLocalToothMap((prev) => {
        const base =
          Object.keys(prev).length > 0 ? prev : chart?.toothMap || {};
        const current = base[selectedTooth] || emptyToothItem();

        return {
          ...base,
          [selectedTooth]: {
            ...current,
            states: [procedure.resultingCondition as ToothCondition],
            note: current.note || procedure.name,
          },
        };
      });
    }
  }

  function handleRemoveVisitItem(index: number) {
    setVisitItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveChartIfNeeded() {
    if (!Object.keys(toothMap).length) return;

    const payload = {
      patientId,
      toothMap,
    };

    if (chart && getId(chart)) {
      await updateChart({
        chartId: getId(chart),
        payload,
      });
    } else {
      await createChart(payload);
    }

    setLocalToothMap({});
  }

  async function handleAddVisit() {
    if (!selectedCourseId) {
      alert("Treatment course tanlang");
      setActiveTab("COURSE");
      return;
    }

    if (selectedCourse?.status === "COMPLETED") {
      alert("Bu course completed bo‘lgan. Visit qo‘shib bo‘lmaydi.");
      setActiveTab("COURSE");
      return;
    }

    if (!appointmentId) {
      alert(
        "Appointment ID topilmadi. Appointmentdan Start Visit qilib kiring.",
      );
      return;
    }

    if (!doctorId.trim()) {
      alert("Doctor ID kiriting");
      return;
    }

    if (!doctorNotes.trim()) {
      alert("Doctor notes kiriting");
      return;
    }

    if (visitItems.length === 0) {
      alert("Kamida bitta procedure tanlang");
      return;
    }

    try {
      await addVisit({
        courseId: selectedCourseId,
        payload: {
          appointmentId,
          visitDate,
          doctorId: doctorId.trim(),
          doctorNotes: doctorNotes.trim(),
          items: visitItems,
        },
      });

      await saveChartIfNeeded();

      setDoctorNotes("");
      setVisitItems([]);
      setIsAddVisitModalOpen(false);
      setActiveTab("COURSE");

      alert("Visit saqlandi va chart yangilandi");
    } catch (error) {
      console.error(error);
      alert("Visit saqlashda xatolik bo‘ldi");
    }
  }

  async function handleCompleteCourse(courseId: string) {
    const yes = confirm("Davolanish kursini yakunlaysizmi?");

    if (!yes) return;

    await completeCourse(courseId);

    if (selectedCourseId === courseId) {
      setSelectedCourseId("");
      setVisitItems([]);
    }

    setCourseStatusFilter("COMPLETED");
    setActiveTab("COURSE");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PatientInfoCard patient={patient} isLoading={patientLoading} />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <TreatmentTabButton
              active={activeTab === "CHART"}
              icon={<Activity className="h-5 w-5" />}
              label="Chart"
              onClick={() => setActiveTab("CHART")}
            />

            <TreatmentTabButton
              active={activeTab === "COURSE"}
              icon={<ClipboardList className="h-5 w-5" />}
              label="Davolash bosqichi"
              onClick={() => setActiveTab("COURSE")}
            />

            <TreatmentTabButton
              active={activeTab === "VISIT"}
              icon={<BadgeDollarSign className="h-5 w-5" />}
              label="Visit qo‘shish"
              onClick={() => setActiveTab("VISIT")}
            />

            {isAddVisitModalOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
                  <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
                          <CalendarDays className="h-6 w-6" />
                          Visit qo‘shish
                        </h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Active course uchun procedure tanlang va visit
                          saqlang.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddVisitModalOpen(false)}
                        className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                          <FileText size={20} />
                          Add Visit
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Course tanlang, doctor notes yozing, procedure
                          qo‘shing.
                        </p>

                        <div className="mt-5 space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Selected course
                            </label>

                            <select
                              value={selectedCourseId}
                              onChange={(event) =>
                                setSelectedCourseId(event.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            >
                              <option value="">Course tanlang</option>
                              {activeCourses.map((course) => (
                                <option
                                  key={getId(course)}
                                  value={getId(course)}
                                >
                                  {course.mainDiagnosis} — {course.status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Visit date
                            </label>

                            <input
                              type="datetime-local"
                              value={visitDate}
                              onChange={(event) =>
                                setVisitDate(event.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Doctor ID
                            </label>

                            <input
                              value={doctorId}
                              onChange={(event) =>
                                setDoctorId(event.target.value)
                              }
                              placeholder="6a0b1ad5b1979b74246dd5d3"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Doctor notes
                            </label>

                            <textarea
                              value={doctorNotes}
                              onChange={(event) =>
                                setDoctorNotes(event.target.value)
                              }
                              placeholder="Kanal doimiy material bilan to'ldirildi..."
                              className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Davolanadigan tishni tanlang
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Procedure bosilganda shu tanlangan tishga
                                  qo‘shiladi.
                                </p>
                              </div>

                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                                #{selectedTooth}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {treatmentTeeth.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddVisitModalOpen(false);
                                    setActiveTab("CHART");
                                  }}
                                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-slate-200 hover:bg-blue-50"
                                >
                                  Chartdan tish tanlash
                                </button>
                              ) : (
                                treatmentTeeth.map((toothNumber) => {
                                  const active = selectedTooth === toothNumber;

                                  return (
                                    <button
                                      key={toothNumber}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTooth(toothNumber)
                                      }
                                      className={[
                                        "rounded-xl px-4 py-2 text-sm font-bold transition",
                                        active
                                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700",
                                      ].join(" ")}
                                    >
                                      {toothNumber}-tish
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-800">
                                Visit items
                              </p>

                              <p className="text-sm font-bold text-blue-700">
                                {formatMoney(totalVisitPrice)}
                              </p>
                            </div>

                            {visitItems.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Hali procedure tanlanmadi.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {visitItems.map((item, index) => (
                                  <div
                                    key={`${item.procedureId}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
                                  >
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {item.toothNumber}-tish
                                      </p>

                                      <p className="text-xs text-slate-500">
                                        {item.note}
                                      </p>

                                      <p className="text-xs font-bold text-blue-700">
                                        {formatMoney(item.price)}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() =>
                                        handleRemoveVisitItem(index)
                                      }
                                      className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleAddVisit}
                            disabled={
                              isAddingVisit ||
                              selectedCourse?.status === "COMPLETED" ||
                              visitItems.length === 0
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isAddingVisit || isCreating || isUpdating ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CalendarDays size={16} />
                            )}
                            {visitItems.length === 0
                              ? "Avval procedure tanlang"
                              : "Add visit"}
                          </button>

                          {selectedCourse?.status === "COMPLETED" && (
                            <p className="text-sm font-medium text-red-500">
                              Bu course completed bo‘lgan. Visit qo‘shib
                              bo‘lmaydi.
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h2 className="text-lg font-bold text-slate-900">
                              Procedures
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                              Procedure bosilganda tanlangan tishga qo‘shiladi:{" "}
                              <span className="font-bold text-slate-900">
                                {selectedTooth}-tish
                              </span>
                            </p>
                          </div>

                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              value={procedureSearch}
                              onChange={(event) =>
                                setProcedureSearch(event.target.value)
                              }
                              placeholder="Search procedure..."
                              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 md:w-[280px]"
                            />
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                          <p className="text-sm font-bold text-blue-800">
                            Tanlangan tish: {selectedTooth}-tish
                          </p>

                          <p className="mt-1 text-xs font-medium text-blue-600">
                            Boshqa tishga procedure qo‘shish uchun chap
                            tomondagi “Davolanadigan tishni tanlang” chiplaridan
                            foydalaning.
                          </p>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {proceduresLoading || proceduresFetching ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Loader2 size={16} className="animate-spin" />
                              Loading procedures...
                            </div>
                          ) : procedures.length === 0 ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:col-span-2">
                              <p className="text-sm font-bold text-amber-900">
                                Procedure topilmadi
                              </p>

                              <p className="mt-2 text-sm text-amber-700">
                                Add Visit qilish uchun kamida bitta procedure
                                kerak. Procedure endi alohida sahifada
                                yaratiladi.
                              </p>

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <button
                                  type="button"
                                  onClick={() => setProcedureSearch("")}
                                  className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                                >
                                  Searchni tozalash
                                </button>

                                <Link
                                  href="/procedures"
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
                                >
                                  <Plus className="h-4 w-4" />
                                  Procedures sahifasiga o‘tish
                                </Link>
                              </div>
                            </div>
                          ) : (
                            procedures.map((procedure) => (
                              <button
                                key={getId(procedure)}
                                onClick={() => handleAddProcedure(procedure)}
                                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {procedure.name}
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                      {procedure.code}
                                    </p>
                                  </div>

                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                    {procedure.resultingCondition}
                                  </span>
                                </div>

                                <p className="mt-3 text-sm font-bold text-blue-700">
                                  {formatMoney(procedure.defaultPrice)}
                                </p>

                                <p className="mt-2 text-xs font-bold text-emerald-600">
                                  Bosish: visit itemsga qo‘shish
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>,
                document.body,
              )}

            {activeTab === "CHART" && (
              <button
                type="button"
                onClick={handleOpenCreateCourseModal}
                disabled={chartProblemTeeth.length === 0}
                className="ml-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Course ochish
              </button>
            )}
          </div>
        </div>

        {isCreateCourseModalOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
                      <Plus className="h-6 w-6" />
                      Create Treatment Course
                    </h2>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Dental chartdan keyin asosiy diagnosis yozib course
                      ochiladi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateCourseModalOpen(false)}
                    className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-blue-900">
                          Chart bo‘yicha davolanadigan tishlar
                        </p>

                        <p className="mt-1 text-sm font-semibold text-blue-700">
                          Masalan chartda 21 va 11 belgilangan bo‘lsa, course
                          ochishda shu tishlarni tanlang.
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">
                        {selectedCourseTeeth.length} tanlandi
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {chartProblemTeeth.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateCourseModalOpen(false);
                            setActiveTab("CHART");
                          }}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                        >
                          Avval chartda tish belgilang
                        </button>
                      ) : (
                        chartProblemTeeth.map((item) => {
                          const active = selectedCourseTeeth.includes(
                            item.toothNumber,
                          );

                          return (
                            <button
                              key={item.toothNumber}
                              type="button"
                              onClick={() =>
                                handleToggleCourseTooth(item.toothNumber)
                              }
                              className={[
                                "min-w-[130px] rounded-2xl px-5 py-4 text-left text-sm font-black ring-1 transition",
                                active
                                  ? "bg-blue-600 text-white ring-blue-600 shadow-lg shadow-blue-600/20"
                                  : "bg-white text-slate-700 ring-blue-100 hover:bg-blue-100 hover:text-blue-700",
                              ].join(" ")}
                            >
                              <span className="block text-xl">
                                #{item.toothNumber}
                              </span>
                              <span
                                className={
                                  active
                                    ? "mt-1 block text-xs text-blue-100"
                                    : "mt-1 block text-xs text-slate-500"
                                }
                              >
                                {getToothLabel(item.toothNumber).replace(
                                  `${item.toothNumber}-tish — `,
                                  "",
                                )}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-black text-slate-700">
                        Main diagnosis
                      </label>

                      <button
                        type="button"
                        onClick={handleAutoFillDiagnosis}
                        disabled={selectedCourseTeeth.length === 0}
                        className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Auto to‘ldirish
                      </button>
                    </div>

                    <textarea
                      value={mainDiagnosis}
                      onChange={(event) => setMainDiagnosis(event.target.value)}
                      placeholder="Masalan: 11 va 21-tish karies davolanishi"
                      className="min-h-[140px] w-full resize-none rounded-3xl border border-slate-200 bg-white p-5 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateCourseModalOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>

                    <button
                      onClick={handleCreateCourse}
                      disabled={
                        isCreatingCourse || selectedCourseTeeth.length === 0
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingCourse ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Plus size={18} />
                      )}
                      Create course
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {activeTab === "CHART" && (
          <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
            <div className="space-y-4">
              {chartLoading ? (
                <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
                  <Loader2 className="animate-spin text-blue-600" size={36} />
                </div>
              ) : (
                <>
                  {chart?.toothMap ? (
                    <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-blue-900">
                          Oldingi chart topildi
                        </p>

                        <p className="text-sm text-blue-700">
                          Chart ID: {getId(chart)}
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

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Chart status</p>

                      <div className="mt-2 flex items-center gap-2">
                        {chart ? (
                          <>
                            <CheckCircle2
                              className="text-emerald-500"
                              size={20}
                            />
                            <span className="font-bold text-slate-900">
                              Mavjud
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus className="text-blue-500" size={20} />
                            <span className="font-bold text-slate-900">
                              Yangi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">
                        Belgilangan tishlar
                      </p>

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
                  </div>

                  <Dental3DChart
                    selectedTooth={selectedTooth}
                    toothMap={toothMap}
                    onSelectTooth={handleSelectTooth}
                  />

                  {chartProblemTeeth.length === 0 && (
                    <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-700">
                      Avval chartda kamida bitta tishga diagnoz yoki holat
                      belgilang.
                    </div>
                  )}
                </>
              )}
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
                    value={selectedToothData.diagnoses[0] || ""}
                    onChange={(event) =>
                      updateSelectedTooth({
                        diagnoses: event.target.value
                          ? [event.target.value as ToothCondition]
                          : [],
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Diagnoz tanlang</option>

                    {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                      <option key={diagnosis} value={diagnosis}>
                        {diagnosisLabels[diagnosis]}
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
                    value={selectedToothData.states[0] || ""}
                    onChange={(event) =>
                      updateSelectedTooth({
                        states: event.target.value
                          ? [event.target.value as ToothCondition]
                          : [],
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Holat tanlang</option>

                    {STATE_OPTIONS.map((state) => (
                      <option key={state} value={state}>
                        {stateLabels[state]}
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
                    value={selectedToothData.note}
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
                        {selectedToothData.diagnoses[0]
                          ? diagnosisLabels[
                              selectedToothData.diagnoses[0] as ToothCondition
                            ] || selectedToothData.diagnoses[0]
                          : "Tanlanmagan"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Holat:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedToothData.states[0]
                          ? stateLabels[
                              selectedToothData.states[0] as ToothCondition
                            ] || selectedToothData.states[0]
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
                    onClick={handleSaveChart}
                    disabled={isCreating || isUpdating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreating || isUpdating ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Saqlash
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("COURSE")}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Keyingi: Davolash bosqichi
                </button>
              </div>
            </aside>
          </section>
        )}

        {activeTab === "COURSE" && (
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ClipboardList size={20} />
                    Treatment Courses
                  </h2>

                  <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setCourseStatusFilter("ACTIVE")}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-black transition",
                        courseStatusFilter === "ACTIVE"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      Active ({activeCourses.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setCourseStatusFilter("COMPLETED")}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-black transition",
                        courseStatusFilter === "COMPLETED"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      Completed ({completedCourses.length})
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {coursesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Loading courses...
                    </div>
                  ) : visibleCourses.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      {courseStatusFilter === "ACTIVE"
                        ? "Active treatment course yo‘q."
                        : "Completed treatment course yo‘q."}
                    </p>
                  ) : (
                    visibleCourses.map((course) => {
                      const courseId = getId(course);

                      return (
                        <div
                          key={courseId}
                          className={[
                            "rounded-2xl border p-4 transition",
                            selectedHistoryCourseId === courseId
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectCourse(course)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {course.mainDiagnosis}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Status: {course.status}
                                </p>
                              </div>

                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                                {course.visits?.length || 0} visits
                              </span>
                            </div>

                            <p className="mt-3 text-sm font-bold text-blue-700">
                              {formatMoney(course.totalCoursePrice)}
                            </p>

                            <p
                              className={[
                                "mt-2 text-xs font-bold",
                                course.status === "COMPLETED"
                                  ? "text-slate-500"
                                  : "text-blue-600",
                              ].join(" ")}
                            >
                              {course.status === "COMPLETED"
                                ? "Completed course — visit ochilmaydi"
                                : "Active course — Visit qo‘shish button orqali ochiladi"}
                            </p>
                          </button>

                          {course.status !== "COMPLETED" && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenAddVisitModal(course)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                              >
                                <Plus size={14} />
                                Visit qo‘shish
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCompleteCourse(courseId)}
                                disabled={isCompleting}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                <CheckCircle2 size={14} />
                                Complete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Visit history
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Har bir visit, shifokor, muolaja soni va summa timeline
                    ko‘rinishida.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                  {selectedHistoryVisits.length} visit
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {visibleCourses.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    {courseStatusFilter === "ACTIVE"
                      ? "Active course visit history yo‘q."
                      : "Completed course visit history yo‘q."}
                  </p>
                ) : !selectedHistoryCourse ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Visit history ko‘rish uchun treatment course tanlang.
                  </p>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-slate-950">
                          {selectedHistoryCourse.mainDiagnosis}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-black",
                              selectedHistoryCourse.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700",
                            ].join(" ")}
                          >
                            {selectedHistoryCourse.status}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {selectedHistoryVisits.length} visits
                          </span>
                        </div>
                      </div>

                      <p className="font-black text-blue-700">
                        {formatMoney(selectedHistoryCourse.totalCoursePrice)}
                      </p>
                    </div>

                    {selectedHistoryVisits.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                        Bu courseda visit yo‘q.
                      </p>
                    ) : (
                      <div className="relative pl-8">
                        <div className="absolute left-[17px] top-4 bottom-4 w-px bg-blue-100" />

                        <div className="space-y-4">
                          {selectedHistoryVisits.map(
                            (visit: any, visitIndex: number) => {
                              const isFirstVisit = visitIndex === 0;
                              const visitTotal = getVisitTotal(visit);
                              const itemsCount = visit.items?.length || 0;

                              return (
                                <div
                                  key={`${visit.appointmentId || visitIndex}-${visitIndex}`}
                                  className="relative"
                                >
                                  <div
                                    className={[
                                      "absolute -left-8 top-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white shadow-sm ring-4 ring-white",
                                      isFirstVisit
                                        ? "bg-emerald-500"
                                        : "bg-blue-500",
                                    ].join(" ")}
                                  >
                                    {visitIndex + 1}
                                  </div>

                                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                                    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr_0.7fr_0.8fr] md:items-center">
                                      <div>
                                        <p className="text-sm font-black text-slate-950">
                                          Visit {visitIndex + 1}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                          {formatVisitDateTime(visit.visitDate)}
                                        </p>
                                      </div>

                                      <div className="md:border-l md:border-slate-100 md:pl-5">
                                        <p className="text-xs font-bold text-slate-400">
                                          Shifokor
                                        </p>
                                        <p className="mt-1 text-sm font-black text-slate-800">
                                          {getVisitDoctorName(visit)}
                                        </p>
                                      </div>

                                      <div className="md:border-l md:border-slate-100 md:pl-5">
                                        <p className="text-xs font-bold text-slate-400">
                                          Muolajalar
                                        </p>
                                        <p className="mt-1 text-sm font-black text-slate-800">
                                          {itemsCount} ta
                                        </p>
                                      </div>

                                      <div className="md:border-l md:border-slate-100 md:pl-5">
                                        <p className="text-xs font-bold text-slate-400">
                                          Summasi
                                        </p>
                                        <p className="mt-1 text-sm font-black text-slate-900">
                                          {formatMoney(visitTotal)}
                                        </p>
                                      </div>
                                    </div>

                                    {visit.doctorNotes && (
                                      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                                        {visit.doctorNotes}
                                      </p>
                                    )}

                                    {visit.items && visit.items.length > 0 && (
                                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {visit.items.map(
                                          (item: any, itemIndex: number) => (
                                            <div
                                              key={`${item.procedureId || itemIndex}-${itemIndex}`}
                                              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                            >
                                              <p className="text-sm font-black text-slate-900">
                                                {item.toothNumber}-tish
                                              </p>
                                              <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
                                                {item.note || "Muolaja"}
                                              </p>
                                              <p className="mt-2 text-xs font-black text-blue-700">
                                                {formatMoney(
                                                  Number(
                                                    item.price ||
                                                      item.amount ||
                                                      0,
                                                  ),
                                                )}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "VISIT" && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FileText size={20} />
                Add Visit
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Course tanlang, doctor notes yozing, procedure qo‘shing.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Selected course
                  </label>

                  <select
                    value={selectedCourseId}
                    onChange={(event) =>
                      setSelectedCourseId(event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Course tanlang</option>
                    {activeCourses.map((course) => (
                      <option key={getId(course)} value={getId(course)}>
                        {course.mainDiagnosis} — {course.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Visit date
                  </label>

                  <input
                    type="datetime-local"
                    value={visitDate}
                    onChange={(event) => setVisitDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Doctor ID
                  </label>

                  <input
                    value={doctorId}
                    onChange={(event) => setDoctorId(event.target.value)}
                    placeholder="6a0b1ad5b1979b74246dd5d3"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Doctor notes
                  </label>

                  <textarea
                    value={doctorNotes}
                    onChange={(event) => setDoctorNotes(event.target.value)}
                    placeholder="Kanal doimiy material bilan to'ldirildi..."
                    className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Davolanadigan tishni tanlang
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Procedure bosilganda shu tanlangan tishga qo‘shiladi.
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      #{selectedTooth}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {treatmentTeeth.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("CHART")}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-slate-200 hover:bg-blue-50"
                      >
                        Chartdan tish tanlash
                      </button>
                    ) : (
                      treatmentTeeth.map((toothNumber) => {
                        const active = selectedTooth === toothNumber;

                        return (
                          <button
                            key={toothNumber}
                            type="button"
                            onClick={() => setSelectedTooth(toothNumber)}
                            className={[
                              "rounded-xl px-4 py-2 text-sm font-bold transition",
                              active
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700",
                            ].join(" ")}
                          >
                            {toothNumber}-tish
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">
                      Visit items
                    </p>

                    <p className="text-sm font-bold text-blue-700">
                      {formatMoney(totalVisitPrice)}
                    </p>
                  </div>

                  {visitItems.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Hali procedure tanlanmadi.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visitItems.map((item, index) => (
                        <div
                          key={`${item.procedureId}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.toothNumber}-tish
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.note}
                            </p>

                            <p className="text-xs font-bold text-blue-700">
                              {formatMoney(item.price)}
                            </p>
                          </div>

                          <button
                            onClick={() => handleRemoveVisitItem(index)}
                            className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddVisit}
                  disabled={
                    isAddingVisit ||
                    selectedCourse?.status === "COMPLETED" ||
                    visitItems.length === 0
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingVisit || isCreating || isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CalendarDays size={16} />
                  )}
                  {visitItems.length === 0
                    ? "Avval procedure tanlang"
                    : "Add visit"}
                </button>

                {selectedCourse?.status === "COMPLETED" && (
                  <p className="text-sm font-medium text-red-500">
                    Bu course completed bo‘lgan. Visit qo‘shib bo‘lmaydi.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Procedures
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Procedure bosilganda tanlangan tishga qo‘shiladi:{" "}
                    <span className="font-bold text-slate-900">
                      {selectedTooth}-tish
                    </span>
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={procedureSearch}
                    onChange={(event) => setProcedureSearch(event.target.value)}
                    placeholder="Search procedure..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 md:w-[280px]"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-800">
                  Tanlangan tish: {selectedTooth}-tish
                </p>

                <p className="mt-1 text-xs font-medium text-blue-600">
                  Boshqa tishga procedure qo‘shish uchun chap tomondagi
                  “Davolanadigan tishni tanlang” chiplaridan foydalaning.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {proceduresLoading || proceduresFetching ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    Loading procedures...
                  </div>
                ) : procedures.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:col-span-2">
                    <p className="text-sm font-bold text-amber-900">
                      Procedure topilmadi
                    </p>

                    <p className="mt-2 text-sm text-amber-700">
                      Add Visit qilish uchun kamida bitta procedure kerak.
                      Procedure endi alohida sahifada yaratiladi.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setProcedureSearch("")}
                        className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                      >
                        Searchni tozalash
                      </button>

                      <Link
                        href="/procedures"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
                      >
                        <Plus className="h-4 w-4" />
                        Procedures sahifasiga o‘tish
                      </Link>
                    </div>
                  </div>
                ) : (
                  procedures.map((procedure) => (
                    <button
                      key={getId(procedure)}
                      onClick={() => handleAddProcedure(procedure)}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {procedure.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {procedure.code}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {procedure.resultingCondition}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-bold text-blue-700">
                        {formatMoney(procedure.defaultPrice)}
                      </p>

                      <p className="mt-2 text-xs font-bold text-emerald-600">
                        Bosish: visit itemsga qo‘shish
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}