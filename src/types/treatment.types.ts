// File: src/types/dental-chart.types.ts

import { ToothCondition } from "../lib/enums/enums.types";

export interface ToothItem {
  diagnoses: ToothCondition[];
  states: ToothCondition[];
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