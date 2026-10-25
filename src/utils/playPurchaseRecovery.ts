/**
 * Google Play can complete a purchase while our API is offline. The next
 * app launch, foreground event, or network reconnection must query Play for
 * owned items and send them to the backend for independent verification.
 */
export type RecoverablePlayPurchase = {
  productId: string;
  purchaseToken?: string | null;
  purchaseState?: string | null;
  isSuspendedAndroid?: boolean;
};

export const selectRecoverablePlayPurchases = <T extends RecoverablePlayPurchase>(
  purchases: readonly T[],
  validProductIds: readonly string[],
  lifetimeProductId: string,
): T[] => {
  const knownIds = new Set(validProductIds);
  const seenTokens = new Set<string>();

  return purchases
    .filter(purchase => {
      if (!knownIds.has(purchase.productId)) return false;
      if (!purchase.purchaseToken || purchase.purchaseState === 'pending') return false;
      if (purchase.isSuspendedAndroid) return false;
      if (seenTokens.has(purchase.purchaseToken)) return false;
      seenTokens.add(purchase.purchaseToken);
      return true;
    })
    // Lifetime is processed last, so it remains the strongest entitlement.
    .sort(
      (a, b) =>
        Number(a.productId === lifetimeProductId) -
        Number(b.productId === lifetimeProductId),
    );
};
