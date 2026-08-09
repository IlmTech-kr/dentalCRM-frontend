import type { Currency, PaymentMethod } from "@/src/features/treatment-payments/types";

export interface InvoiceLine {
  visitDate?: string | null;
  procedureName: string;
  toothNumber?: string | null;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoicePaymentSnapshot {
  paidAt: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
}

export interface TreatmentInvoice {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  treatmentCourseId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  diagnosis?: string | null;
  currency: Currency;
  lines: InvoiceLine[];
  paymentSnapshots: InvoicePaymentSnapshot[];
  totalAmount: number;
  paidAmountAtIssue: number;
  balanceDueAtIssue: number;
  currentPaidAmount: number;
  currentBalance: number;
  pdfAvailable: boolean;
}
