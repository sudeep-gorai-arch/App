import API from './api';
import { ApiResponse } from './types';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string;
}

export interface SubscriptionStatus {
    isPremium: boolean;
    expiresAt?: string | null;
    subscription?: any;
}

export interface VerifySubscriptionRequest {
    purchaseToken: string;
    productId: string;
}

/**
 * Public - Available Plans
 */
export const getSubscriptionPlans = async () => {
    const response = await API.get<ApiResponse<SubscriptionPlan[]>>(
        '/subscriptions/plans',
    );

    return response.data;
};

/**
 * Current User Subscription Status
 */
export const getSubscriptionStatus = async () => {
    const response = await API.get<ApiResponse<SubscriptionStatus>>(
        '/subscriptions/status',
    );

    return response.data;
};

/**
 * Verify Purchase
 */
export const verifySubscription = async (
    data: VerifySubscriptionRequest,
) => {
    const response = await API.post<ApiResponse<SubscriptionStatus>>(
        '/subscriptions/verify',
        data,
    );

    return response.data;
};