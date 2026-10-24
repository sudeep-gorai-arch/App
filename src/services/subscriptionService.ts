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
  googlePlayProductId?: string;
}

export interface SubscriptionRecord {
  id: string;
  plan: SubscriptionPlanCode;
  platform: string;
  orderId?: string | null;
  razorpayOrderId?: string | null;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySubscriptionId?: string | null;
  purchaseToken?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  active: boolean;
  autoRenewing?: boolean | null;
  googlePlayState?: string | null;
  cancelAtCycleEnd?: boolean;
  cancel_at_cycle_end?: boolean;
  cancelledAt?: string | null;
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
  notes?: any;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  premiumUntil?: string | null;
  currentPlan: SubscriptionPlanCode;
  activeSubscription?: SubscriptionRecord | null;
  latestSubscription?: SubscriptionRecord | null;
  latestPayment?: PaymentRecord | null;
  cancellation?: {
    cancelAtCycleEnd: boolean;
    cancelledAt?: string | null;
    razorpaySubscriptionId?: string | null;
  };
}

export interface VerifyGooglePlayPurchaseRequest {
  plan: Exclude<PaidSubscriptionPlan, 'QUARTERLY'>;
  productId: string;
  purchaseToken: string;
  packageName: string;
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


export const verifyGooglePlayPurchase = async (
  body: VerifyGooglePlayPurchaseRequest,
): Promise<VerifyPaymentResponse> => {
  const response = await API.post<ApiResponse<VerifyPaymentResponse>>(
    '/subscriptions/google-play/verify',
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

export const cancelSubscription = async (
  cancelAtCycleEnd = true,
): Promise<SubscriptionStatus> => {
  const response = await API.post<ApiResponse<SubscriptionStatus>>(
    '/subscriptions/cancel',
    {
      cancel_at_cycle_end: cancelAtCycleEnd,
    },
  );

  return unwrapApiData<SubscriptionStatus>(response);
};