export type PremiumRecord = {
  isPremium?: boolean;
  premiumUntil?: string | null;
  currentPlan?: string | null;
  activeSubscription?: {
    plan?: string | null;
    active?: boolean;
    endDate?: string | null;
  } | null;
};
export const isCurrentPremium = (
  status: PremiumRecord | null | undefined,
  now = Date.now(),
) => {
  if (!status?.isPremium) return false;
  const expiry = status.premiumUntil ?? status.activeSubscription?.endDate;
  return Boolean(expiry && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > now);
};
export const hasRenewingSubscription = (
  plan: string | null | undefined,
  platform: string | null | undefined,
  renewalId?: string | null,
) => {
  const recurring = ['MONTHLY','YEARLY','QUARTERLY'].includes(String(plan ?? '').toUpperCase());
  if (!recurring) return false;
  return String(platform ?? '').toUpperCase() === 'GOOGLE' || Boolean(renewalId?.startsWith('sub_'));
};
