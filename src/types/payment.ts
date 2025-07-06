// Simplified Payment Types for Free and Pro Plans Only

export type PlanType = "free" | "pro";

export interface PlanConfig {
  name: string;
  price: number;
  description: string;
  features: string[];
  resumeLimit?: number; // Maximum number of resumes that can be uploaded
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
