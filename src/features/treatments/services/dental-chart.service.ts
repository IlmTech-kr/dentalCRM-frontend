/**
 * File: src/features/treatments/services/dental-chart.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateDentalChartDto,
  DentalChart,
  UpdateDentalChartDto,
} from "@/src/types/dental-chart.types";

function normalizeChart(chart: any): DentalChart {
  return {
    ...chart,
    id: chart.id || chart._id,
  };
}

export const dentalChartService = {
  async create(payload: CreateDentalChartDto): Promise<DentalChart> {
    try {
      const { data } = await tenantHttp().post(
        ENDPOINTS.dental.charts.create,
        payload
      );
      return normalizeChart(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalChart] create failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async getById(chartId: string): Promise<DentalChart> {
    try {
      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.charts.getById(chartId)
      );
      return normalizeChart(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalChart] getById failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async getByPatient(patientId: string): Promise<DentalChart | null> {
    try {
      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.charts.getByPatient(patientId)
      );
      return normalizeChart(data);
    } catch (error: any) {
      // 404 — chart yo'q, null qaytaramiz (xato emas)
      if (error?.status === 404 || error?.response?.status === 404) {
        return null;
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalChart] getByPatient failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async update(chartId: string, payload: UpdateDentalChartDto): Promise<DentalChart> {
    try {
      const { data } = await tenantHttp().put(
        ENDPOINTS.dental.charts.update(chartId),
        payload
      );
      return normalizeChart(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalChart] update failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async delete(chartId: string): Promise<void> {
    try {
      await tenantHttp().delete(ENDPOINTS.dental.charts.delete(chartId));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalChart] delete failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },
};