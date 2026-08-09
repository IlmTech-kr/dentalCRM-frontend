"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import { invoiceService } from "../services/invoice.service";

export const invoiceKeys = {
  all: ["treatment-invoices"] as const,
  byCourse: (courseId: string) => [...invoiceKeys.all, "course", courseId] as const,
  byId: (invoiceId: string) => [...invoiceKeys.all, "id", invoiceId] as const,
};

export function useGetInvoiceByCourse(courseId: string | null | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: invoiceKeys.byCourse(courseId ?? ""),
    queryFn: () => invoiceService.getByTreatmentCourse(courseId as string),
    enabled: Boolean(courseId) && isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useGetInvoiceById(invoiceId: string | null | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: invoiceKeys.byId(invoiceId ?? ""),
    queryFn: () => invoiceService.getById(invoiceId as string),
    enabled: Boolean(invoiceId) && isAuthenticated,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: ({ invoiceId }: { invoiceId: string; fileName?: string }) =>
      invoiceService.downloadPdf(invoiceId),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = variables.fileName ? `${variables.fileName}.pdf` : "invoice.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useDownloadInvoicePdf] failed:", error.message);
      }
    },
  });
}
