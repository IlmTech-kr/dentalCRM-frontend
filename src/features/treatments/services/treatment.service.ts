/**
 * File: src/features/treatments/services/treatment.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateChartPayload,
  DentalChart,
  UpdateChartPayload,
  ApiResponse,
} from "@/src/types/treatment.types";

function unwrap<T>(responseData: ApiResponse<T> | T): T {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as ApiResponse<T>).data as T;
  }
  return responseData as T;
}

export async function createChart(payload: CreateChartPayload): Promise<DentalChart> {
  try {
    const response = await tenantHttp().post<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.create,
      payload
    );
    return unwrap<DentalChart>(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treatment] createChart failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function getChart(chartId: string): Promise<DentalChart> {
  try {
    const response = await tenantHttp().get<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.getById(chartId)
    );
    return unwrap<DentalChart>(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treatment] getChart failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function getChartByPatientId(patientId: string): Promise<DentalChart | null> {
  try {
    const response = await tenantHttp().get<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.getByPatientId(patientId)
    );
    return unwrap<DentalChart>(response.data);
  } catch (error: any) {
    if (error?.status === 404 || error?.response?.status === 404) {
      return null;
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treatment] getChartByPatientId failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function updateChart(chartId: string, payload: UpdateChartPayload): Promise<DentalChart> {
  try {
    const response = await tenantHttp().put<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.update(chartId),
      payload
    );
    return unwrap<DentalChart>(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treatment] updateChart failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function deleteChart(chartId: string): Promise<void> {
  try {
    await tenantHttp().delete(ENDPOINTS.dentalCharts.delete(chartId));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treatment] deleteChart failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}