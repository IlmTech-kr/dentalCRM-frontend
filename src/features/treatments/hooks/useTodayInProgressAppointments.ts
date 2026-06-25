//useTodayInProgressAppointments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { treatmentAppointmentService } from "../services/treatment-appointment.service";

function getTodayLocalDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

export function useTodayInProgressAppointments() {
  const today = getTodayLocalDate();

  const query = useQuery({
    queryKey: ["treatment-today-in-progress-appointments", today],
    queryFn: () => treatmentAppointmentService.getTodayInProgress(today),
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 30,
  });

  return {
    today,
    appointments: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}