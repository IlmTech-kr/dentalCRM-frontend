export type ResultingCondition =
  | "FILLING"
  | "CROWN"
  | "IMPLANT"
  | "ROOT_CANAL"
  | "EXTRACTION"
  | "MISSING"
  | string;

export interface DentalProcedure {
  _id: string;
  id?: string;
  tenantId?: string;
  code: string;
  name: string;
  defaultPrice: number;
  resultingCondition: ResultingCondition;
  _class?: string;
}

export interface CreateDentalProcedureDto {
  code: string;
  name: string;
  defaultPrice: number;
  resultingCondition: ResultingCondition;
}

export interface UpdateDentalProcedureDto {
  code: string;
  name: string;
  defaultPrice: number;
  resultingCondition: ResultingCondition;
}