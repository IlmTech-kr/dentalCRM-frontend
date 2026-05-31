import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateDentalChartDto,
  DentalChart,
  UpdateDentalChartDto,
} from "@/src/types/dental-chart.types";

function getSubdomain(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("subDomain") ||
    localStorage.getItem("subdomain") ||
    ""
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

function normalizeChart(chart: any): DentalChart {
  return {
    ...chart,
    id: chart.id || chart._id,
  };
}

export const dentalChartService = {
  async create(payload: CreateDentalChartDto): Promise<DentalChart> {
    const http = getHttp();

    const { data } = await http.post(
      ENDPOINTS.dental.charts.create,
      payload
    );

    return normalizeChart(data);
  },

  async getById(chartId: string): Promise<DentalChart> {
    const http = getHttp();

    const { data } = await http.get(
      ENDPOINTS.dental.charts.getById(chartId)
    );

    return normalizeChart(data);
  },

  async getByPatient(patientId: string): Promise<DentalChart | null> {
    const http = getHttp();

    try {
      const { data } = await http.get(
        ENDPOINTS.dental.charts.getByPatient(patientId)
      );

      return normalizeChart(data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async update(
    chartId: string,
    payload: UpdateDentalChartDto
  ): Promise<DentalChart> {
    const http = getHttp();

    const { data } = await http.put(
      ENDPOINTS.dental.charts.update(chartId),
      payload
    );

    return normalizeChart(data);
  },

  async delete(chartId: string): Promise<void> {
    const http = getHttp();

    await http.delete(ENDPOINTS.dental.charts.delete(chartId));
  },
};