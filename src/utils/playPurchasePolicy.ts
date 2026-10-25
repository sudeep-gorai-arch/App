import type { PremiumRecord } from './premiumStatus';

export type BillingChoice = 'MONTHLY' | 'YEARLY' | 'LIFETIME';
export type PurchaseDecision =
  | { kind: 'allow' }
  | { kind: 'blocked'; reason: string }
  | { kind: 'confirm-lifetime'; reason: string }
  | { kind: 'replace'; reason: string; previousPlan: 'MONTHLY' | 'YEARLY' };

/**
 * Without Play Billing's subscription-replacement API we cannot safely
 * exchange two concurrently renewing subscriptions inside our own app.
 */
export const decidePlayPurchase = (
  status: PremiumRecord | null | undefined,
  selectedPlan: BillingChoice,
  now = Date.now(),
): PurchaseDecision => {
  const until = status?.premiumUntil ?? status?.activeSubscription?.endDate;
  const isPremium = Boolean(status?.isPremium && until && Date.parse(until) > now);
  if (!status || !isPremium) return { kind: 'allow' };

  const activePlan = String(
    status.activeSubscription?.plan ?? status.currentPlan ?? '',
  ).toUpperCase();

  if (activePlan === 'LIFETIME') {
    return { kind: 'blocked', reason: 'Lifetime Premium is already active. You do not need to buy another plan.' };
  }

  if (selectedPlan === activePlan) {
    return {
      kind: 'blocked',
      reason: 'This Premium plan is already active.',
    };
  }

  if (selectedPlan !== 'LIFETIME') {
    // Recurring switches use the Play Billing replacement flow with the
    // existing purchase token; a second independent subscription is unsafe.
    if (activePlan !== 'MONTHLY' && activePlan !== 'YEARLY') {
      return { kind: 'blocked', reason: 'This subscription cannot be changed in the app.' };
    }
    return {
      kind: 'replace',
      previousPlan: activePlan,
      reason: 'Google Play will replace the existing recurring plan and show any applicable credit or charge before confirmation.',
    };
  }

  return {
    kind: 'confirm-lifetime',
    reason: 'Lifetime Premium is a separate one-time Google Play purchase. After successful verification, FlexiWalls will request cancellation of your previous subscription renewals. If Play cannot cancel them automatically, you must cancel the old plan in Google Play to avoid another charge. Continue?',
  };
};
