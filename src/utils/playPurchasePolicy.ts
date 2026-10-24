import { isCurrentPremium, type PremiumRecord } from './premiumStatus';

export type BillingChoice = 'MONTHLY' | 'YEARLY' | 'LIFETIME';
export type PurchaseDecision =
  | { kind: 'allow' }
  | { kind: 'blocked'; reason: string }
  | { kind: 'confirm-lifetime'; reason: string };

/**
 * Without Play Billing's subscription-replacement API we cannot safely
 * exchange two concurrently renewing subscriptions inside our own app.
 */
export const decidePlayPurchase = (
  status: PremiumRecord | null | undefined,
  selectedPlan: BillingChoice,
  now = Date.now(),
): PurchaseDecision => {
  if (!status || !isCurrentPremium(status, now)) return { kind: 'allow' };

  const activePlan = String(
    status.activeSubscription?.plan ?? status.currentPlan ?? '',
  ).toUpperCase();

  if (activePlan === 'LIFETIME') {
    return { kind: 'blocked', reason: 'Lifetime Premium is already active. You do not need to buy another plan.' };
  }

  if (selectedPlan !== 'LIFETIME') {
    return {
      kind: 'blocked',
      reason: 'You already have an active Premium subscription. Manage it in Google Play before changing recurring plans, to avoid overlapping charges.',
    };
  }

  return {
    kind: 'confirm-lifetime',
    reason: 'Buying Lifetime Premium does not cancel your existing Google Play subscription. You must cancel auto-renewal in Google Play to avoid future subscription charges. Continue with Lifetime purchase?',
  };
};
