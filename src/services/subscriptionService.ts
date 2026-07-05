import API from './api';
import { ApiResponse } from './types';

export type PaidSubscriptionPlan =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'LIFETIME';

export type SubscriptionPlanCode = 'FREE' | PaidSubscriptionPlan;

export interface SubscriptionPlan {
  plan: PaidSubscriptionPlan;
  title: string;
  amount: number;
  currency: string;
  validityDays: number;
  description?: string;
  displayPrice?: string;
}

export interface VerifyPaymentRequest {
  plan: PaidSubscriptionPlan;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  plan: PaidSubscriptionPlan;
  title: string;
}

export interface SubscriptionRecord {
  id: string;
  plan: SubscriptionPlanCode;
  platform: string;
  orderId?: string | null;
  razorpayOrderId?: string | null;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  razorpayOrderId?: string | null;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  receipt?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  premiumUntil?: string | null;
  currentPlan: SubscriptionPlanCode;
  activeSubscription?: SubscriptionRecord | null;
  latestSubscription?: SubscriptionRecord | null;
  latestPayment?: PaymentRecord | null;
}

export interface VerifyPaymentResponse {
  isPremium: boolean;
  premiumUntil?: string | null;
  currentPlan: SubscriptionPlanCode;
  subscription?: SubscriptionRecord | null;
  activeSubscription?: SubscriptionRecord | null;
  latestPayment?: PaymentRecord | null;
}

const unwrapApiData = <T>(response: unknown): T => {
  const payload = (response as any)?.data ?? response;

  if ((payload as any)?.data !== undefined) {
    return (payload as any).data as T;
  }

  return payload as T;
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await API.get<ApiResponse<SubscriptionPlan[]>>(
    '/subscriptions/plans',
  );

  return unwrapApiData<SubscriptionPlan[]>(response);
};

export const createOrder = async (
  plan: PaidSubscriptionPlan,
): Promise<RazorpayOrder> => {
  const response = await API.post<ApiResponse<RazorpayOrder>>(
    '/subscriptions/create-order',
    { plan },
  );

  return unwrapApiData<RazorpayOrder>(response);
};

export const verifyPayment = async (
  body: VerifyPaymentRequest,
): Promise<VerifyPaymentResponse> => {
  const response = await API.post<ApiResponse<VerifyPaymentResponse>>(
    '/subscriptions/verify',
    body,
  );

  return unwrapApiData<VerifyPaymentResponse>(response);
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await API.get<ApiResponse<SubscriptionStatus>>(
    '/subscriptions/status',
  );

  return unwrapApiData<SubscriptionStatus>(response);
};