// File: src/types/payment.types.ts

export interface CreatePaymentOrderDto {
  planType: string;
  durationMonths: number;
  amountTiyin: number;
  description?: string;
}

export interface CreatePaymentOrderResponse {
  orderId?: string;
  id?: string;
  _id?: string;
  data?: {
    orderId?: string;
    id?: string;
    _id?: string;
  };
}

export interface CreateCheckoutResponse {
  checkoutUrl?: string;
  paymeUrl?: string;
  url?: string;
  data?: {
    checkoutUrl?: string;
    paymeUrl?: string;
    url?: string;
  };
}

// Legacy
export interface CreatePaymentDto {
  planType: string;
  durationMonths: number;
  amountTiyin: number;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  checkoutUrl?: string;
  tenantId: string;
  createdAt: string;
}

export interface PaymentCheckoutResponse {
  checkoutUrl: string;
  orderId: string;
}