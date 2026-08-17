import { ToothCondition } from "../lib/enums/enums.types";

export type ResultingCondition =
  | ToothCondition.FILLING
  | ToothCondition.CROWN
  | ToothCondition.IMPLANT
  | ToothCondition.ROOT_CANAL
  | ToothCondition.EXTRACTED
  | ToothCondition.MISSING
  | ToothCondition.HEALTHY
  | ToothCondition.CARIES
  | ToothCondition.PULPITIS
  | ToothCondition.CRACK
  | ToothCondition.BRIDGE
  | ToothCondition.GINGIVITIS

export interface DentalProcedure {
  _id: string;
  id?: string;
  tenantId?: string;
  code: string;
  name: string;
  defaultPrice: number;
  resultingCondition: ResultingCondition;
  active?: boolean;
  version?: number;
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
