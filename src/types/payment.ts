// Simplified Payment Types for Pro and Premium Plans Only

export type PlanType = "pro" | "premium";

export interface PlanConfig {
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface CreatePaymentRequest {
  plan: PlanType;
  customer_email: string;
  customer_name?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  id: string;
  client_secret: string;
  status: string;
  plan: PlanType;
  amount: number;
  currency: string;
  created: number;
  customer_email: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}
