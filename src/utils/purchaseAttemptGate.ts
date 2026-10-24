/**
 * Synchronous single-flight gate used for Google Play billing attempts.
 * React state alone is not synchronous enough to prevent two rapid taps.
 */
export class PurchaseAttemptGate {
  private inFlight = false;
  private verifying = new Set<string>();

  beginPurchase(): boolean {
    if (this.inFlight) return false;
    this.inFlight = true;
    return true;
  }

  finishPurchase(): void {
    this.inFlight = false;
  }

  isPurchaseInFlight(): boolean {
    return this.inFlight;
  }

  beginVerification(purchaseToken: string): boolean {
    if (this.verifying.has(purchaseToken)) return false;
    this.verifying.add(purchaseToken);
    return true;
  }

  finishVerification(purchaseToken: string): void {
    this.verifying.delete(purchaseToken);
  }
}
