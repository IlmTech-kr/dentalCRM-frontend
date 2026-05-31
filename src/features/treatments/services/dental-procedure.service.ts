import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateDentalProcedureDto,
  DentalProcedure,
  UpdateDentalProcedureDto,
} from "@/src/types/dental-procedure.types";

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

function normalizeProcedure(procedure: any): DentalProcedure {
  return {
    ...procedure,
    id: procedure.id || procedure._id,
    defaultPrice: Number(procedure.defaultPrice || 0),
  };
}

function normalizeProcedureList(data: any): DentalProcedure[] {
  if (Array.isArray(data)) {
    return data.map(normalizeProcedure);
  }

  if (Array.isArray(data?.content)) {
    return data.content.map(normalizeProcedure);
  }

  if (Array.isArray(data?.data)) {
    return data.data.map(normalizeProcedure);
  }

  if (Array.isArray(data?.items)) {
    return data.items.map(normalizeProcedure);
  }

  if (Array.isArray(data?.procedures)) {
    return data.procedures.map(normalizeProcedure);
  }

  if (Array.isArray(data?.result)) {
    return data.result.map(normalizeProcedure);
  }

  if (Array.isArray(data?.results)) {
    return data.results.map(normalizeProcedure);
  }

  return [];
}

export const dentalProcedureService = {
  async create(payload: CreateDentalProcedureDto): Promise<DentalProcedure> {
    const http = getHttp();

    const { data } = await http.post(
      ENDPOINTS.dental.procedures.create,
      payload
    );

    return normalizeProcedure(data);
  },

  async getById(procedureId: string): Promise<DentalProcedure> {
    const http = getHttp();

    const { data } = await http.get(
      ENDPOINTS.dental.procedures.getById(procedureId)
    );

    return normalizeProcedure(data);
  },

  async getAll(search?: string): Promise<DentalProcedure[]> {
    const http = getHttp();

    const cleanSearch = search?.trim();

    const { data } = await http.get(
      ENDPOINTS.dental.procedures.getAll(cleanSearch || undefined)
    );

    console.log("PROCEDURES RESPONSE:", data);

    return normalizeProcedureList(data);
  },

  async update(
    procedureId: string,
    payload: UpdateDentalProcedureDto
  ): Promise<DentalProcedure> {
    const http = getHttp();

    const { data } = await http.put(
      ENDPOINTS.dental.procedures.update(procedureId),
      payload
    );

    return normalizeProcedure(data);
  },

  async delete(procedureId: string): Promise<void> {
    const http = getHttp();

    await http.delete(ENDPOINTS.dental.procedures.delete(procedureId));
  },
};