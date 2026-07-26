export type GooglePlayPlan = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

export const GOOGLE_PLAY_PACKAGE_NAME = 'com.flexiwalls.app';

/**
 * These IDs must exactly match the products created in Google Play Console.
 * Product IDs cannot be changed after creation, so keep them stable.
 */
export const GOOGLE_PLAY_PRODUCT_IDS: Record<GooglePlayPlan, string> = {
  MONTHLY: 'flexiwalls_premium_monthly',
  YEARLY: 'flexiwalls_premium_yearly',
  LIFETIME: 'flexiwalls_premium_lifetime',
};

export const GOOGLE_PLAY_PLAN_BY_PRODUCT_ID = Object.fromEntries(
  Object.entries(GOOGLE_PLAY_PRODUCT_IDS).map(([plan, productId]) => [
    productId,
    plan as GooglePlayPlan,
  ]),
) as Record<string, GooglePlayPlan>;

export const GOOGLE_PLAY_SUBSCRIPTION_IDS = [
  GOOGLE_PLAY_PRODUCT_IDS.MONTHLY,
  GOOGLE_PLAY_PRODUCT_IDS.YEARLY,
] as const;
