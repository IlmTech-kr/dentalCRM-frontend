"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreatePaymentOrderDto } from "@/src/types/payment.types";
import { activatePlanPayment } from "../services/payment.service.ts";

export function useActivatePlanPayment() {
  return useMutation<string, Error, CreatePaymentOrderDto>({
    mutationFn: activatePlanPayment,
  });
}