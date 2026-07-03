import API from "./api";
import { ApiResponse } from "./types";

export interface SubscriptionPlan {
    plan: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
    title: string;
    amount: number;
    currency: string;
    validityDays: number;
}

export interface VerifyPaymentRequest {
    plan: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";

    razorpay_order_id: string;

    razorpay_payment_id: string;

    razorpay_signature: string;
}

export interface SubscriptionStatus {
    isPremium: boolean;
    premiumUntil?: string;
}



export interface CreateOrderResponse {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
    plan: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
    title: string;
}

export const createOrder = async (
    plan: CreateOrderResponse["plan"],
): Promise<CreateOrderResponse> => {



    const response =
        await API.post<ApiResponse<CreateOrderResponse>>(
            "/subscriptions/create-order",
            {
                plan,
            },
        );

    console.log("Order Details ", response);

    return response.data.data;
};

export const getSubscriptionPlans = async () => {
    const response =
        await API.get<ApiResponse<SubscriptionPlan[]>>(
            "/subscriptions/plans"
        );

    return response.data;
};



export const verifyPayment = async (
    body: VerifyPaymentRequest
) => {
    const response =
        await API.post<ApiResponse<any>>(
            "/subscriptions/verify",
            body
        );

    return response.data;
};

export const getSubscriptionStatus = async () => {
    const response =
        await API.get<ApiResponse<SubscriptionStatus>>(
            "/subscriptions/status"
        );

    return response.data;
};