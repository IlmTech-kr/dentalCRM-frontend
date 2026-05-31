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
  id?: string;
  tenantId?: string;
  patientId: string;
  toothMap: ToothMap;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  _class?: string;
}

export interface CreateDentalChartDto {
  patientId: string;
  toothMap: ToothMap;
}

export interface UpdateDentalChartDto {
  patientId: string;
  toothMap: ToothMap;
}