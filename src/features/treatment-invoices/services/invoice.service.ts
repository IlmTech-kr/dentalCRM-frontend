import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type { TreatmentInvoice } from "../types";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as { status?: number; response?: { status?: number } };
  return record.status ?? record.response?.status;
}

export const invoiceService = {
  /** 404 — bu course uchun invoice hali yaratilmagan, null qaytaramiz (xato emas). */
  async getByTreatmentCourse(courseId: string): Promise<TreatmentInvoice | null> {
    try {
      const { data } = await tenantHttp().get<TreatmentInvoice>(
        ENDPOINTS.dental.invoices.byTreatmentCourse(courseId)
      );
      return data;
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return null;
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[Invoice] getByTreatmentCourse failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async getById(invoiceId: string): Promise<TreatmentInvoice> {
    try {
      const { data } = await tenantHttp().get<TreatmentInvoice>(
        ENDPOINTS.dental.invoices.getById(invoiceId)
      );
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Invoice] getById failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },

  async downloadPdf(invoiceId: string): Promise<Blob> {
    try {
      const response = await tenantHttp().get<Blob>(
        ENDPOINTS.dental.invoices.pdf(invoiceId),
        { responseType: "blob" }
      );
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Invoice] downloadPdf failed:", getApiErrorMessage(error));
      }
      throw error;
    }
  },
};
