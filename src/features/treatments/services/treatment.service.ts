import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateChartPayload,
  DentalChart,
  UpdateChartPayload,
  ApiResponse,
} from "@/src/types/treatment.types";

function getSubdomain(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("subDomain") || "";
}

function getHttp() {
  const subDomain = getSubdomain();

  if (!subDomain) {
    throw new Error("No tenant subdomain found");
  }

  return tenantHttp(subDomain);
}

function unwrap<T>(responseData: ApiResponse<T> | T): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as ApiResponse<T>).data as T;
  }

  return responseData as T;
}

export async function createChart(
  payload: CreateChartPayload
): Promise<DentalChart> {
  try {
    const http = getHttp();
    const response = await http.post<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.create,
      payload
    );

    return unwrap<DentalChart>(response.data);
  } catch (error) {
    console.error("Failed to create dental chart:", error);
    throw error;
  }
}

export async function getChart(chartId: string): Promise<DentalChart> {
  try {
    const http = getHttp();
    const response = await http.get<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.getById(chartId)
    );

    return unwrap<DentalChart>(response.data);
  } catch (error) {
    console.error("Failed to get dental chart:", error);
    throw error;
  }
}

export async function getChartByPatientId(
  patientId: string
): Promise<DentalChart | null> {
  try {
    const http = getHttp();
    const response = await http.get<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.getByPatientId(patientId)
    );

    return unwrap<DentalChart>(response.data);
  } catch (error) {
    console.error("Failed to get dental chart by patient:", error);
    throw error;
  }
}

export async function updateChart(
  chartId: string,
  payload: UpdateChartPayload
): Promise<DentalChart> {
  try {
    const http = getHttp();
    const response = await http.put<ApiResponse<DentalChart> | DentalChart>(
      ENDPOINTS.dentalCharts.update(chartId),
      payload
    );

    return unwrap<DentalChart>(response.data);
  } catch (error) {
    console.error("Failed to update dental chart:", error);
    throw error;
  }
}

export async function deleteChart(chartId: string): Promise<void> {
  try {
    const http = getHttp();
    await http.delete(ENDPOINTS.dentalCharts.delete(chartId));
  } catch (error) {
    console.error("Failed to delete dental chart:", error);
    throw error;
  }
}