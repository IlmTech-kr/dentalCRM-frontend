/**
 * File: src/features/treatments/services/dental-procedure.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateDentalProcedureDto,
  DentalProcedure,
  UpdateDentalProcedureDto,
} from "@/src/types/dental-procedure.types";

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeProcedure(procedure: any): DentalProcedure {
  return {
    ...procedure,
    id: procedure.id || procedure._id,
    defaultPrice: Number(procedure.defaultPrice || 0),
  };
}

function normalizeProcedureList(data: any): DentalProcedure[] {
  if (Array.isArray(data)) return data.map(normalizeProcedure);
  if (Array.isArray(data?.content)) return data.content.map(normalizeProcedure);
  if (Array.isArray(data?.data)) return data.data.map(normalizeProcedure);
  if (Array.isArray(data?.items)) return data.items.map(normalizeProcedure);
  if (Array.isArray(data?.procedures)) return data.procedures.map(normalizeProcedure);
  if (Array.isArray(data?.result)) return data.result.map(normalizeProcedure);
  if (Array.isArray(data?.results)) return data.results.map(normalizeProcedure);
  return [];
}

// ---------------------------------------------------------------------------
// Service
//
// tenantHttp() argumentsiz chaqiriladi — subdomain URL dan olinadi.
// getHttp() / getSubdomain() olib tashlandi:
// localStorage fallback AUTH_TENANT_MISMATCH xatosiga olib kelardi.
// ---------------------------------------------------------------------------

export const dentalProcedureService = {
  async create(payload: CreateDentalProcedureDto): Promise<DentalProcedure> {
    try {
      const { data } = await tenantHttp().post(
        ENDPOINTS.dental.procedures.create,
        payload
      );

      return normalizeProcedure(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalProcedure] create failed:", getApiErrorMessage(error));
      }

      throw new Error(getApiErrorMessage(error, "Failed to create procedure"));
    }
  },

  async getById(procedureId: string): Promise<DentalProcedure> {
    try {
      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.procedures.getById(procedureId)
      );

      return normalizeProcedure(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalProcedure] getById failed:", getApiErrorMessage(error));
      }

      throw new Error(getApiErrorMessage(error, "Failed to load procedure"));
    }
  },

  async getAll(search?: string): Promise<DentalProcedure[]> {
    try {
      const cleanSearch = search?.trim() || undefined;

      const { data } = await tenantHttp().get(
        ENDPOINTS.dental.procedures.getAll(cleanSearch)
      );

      return normalizeProcedureList(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalProcedure] getAll failed:", getApiErrorMessage(error));
      }

      throw new Error(getApiErrorMessage(error, "Failed to load procedures"));
    }
  },

  async update(
    procedureId: string,
    payload: UpdateDentalProcedureDto
  ): Promise<DentalProcedure> {
    try {
      const { data } = await tenantHttp().put(
        ENDPOINTS.dental.procedures.update(procedureId),
        payload
      );

      return normalizeProcedure(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalProcedure] update failed:", getApiErrorMessage(error));
      }

      throw new Error(getApiErrorMessage(error, "Failed to update procedure"));
    }
  },

  async delete(procedureId: string): Promise<void> {
    try {
      await tenantHttp().delete(ENDPOINTS.dental.procedures.delete(procedureId));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DentalProcedure] delete failed:", getApiErrorMessage(error));
      }

      throw new Error(getApiErrorMessage(error, "Failed to delete procedure"));
    }
  },
};