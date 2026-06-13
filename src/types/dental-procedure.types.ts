// File: src/types/dental-procedure.types.ts

import { ToothCondition } from "../lib/enums/enums.types";

export type ResultingCondition =
  | ToothCondition.FILLING
  | ToothCondition.CROWN
  | ToothCondition.IMPLANT
  | ToothCondition.ROOT_CANAL
  | ToothCondition.EXTRACTED
  | ToothCondition.MISSING;

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