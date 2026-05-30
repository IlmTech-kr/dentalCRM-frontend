export type ToothDiagnosis =
  | "CARIES"
  | "PULPITIS"
  | "PERIODONTITIS"
  | "GINGIVITIS"
  | "ABSCESS"
  | string;

export type ToothState =
  | "MISSING"
  | "FILLING"
  | "CROWN"
  | "IMPLANT"
  | "ROOT_CANAL"
  | string;

export interface ToothItem {
  diagnoses: ToothDiagnosis[];
  states: ToothState[];
  note: string;
}

export type ToothMap = Record<string, ToothItem>;

export interface DentalChart {
  _id: string;
  patientId: string;
  toothMap: ToothMap;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChartPayload {
  patientId: string;
  toothMap: ToothMap;
}

export interface UpdateChartPayload {
  patientId: string;
  toothMap: ToothMap;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}