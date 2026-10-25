import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { getAvailablePurchases, useIAP } from 'expo-iap';

import { useAuth } from '../context/AuthContext';
import { getStoredToken } from '../services/authSessionStorage';
import { verifyGooglePlayPurchase } from '../services/subscriptionService';
import { isCurrentPremium } from '../utils/premiumStatus';
import { selectRecoverablePlayPurchases } from '../utils/playPurchaseRecovery';
import {
  GOOGLE_PLAY_PACKAGE_NAME,
  GOOGLE_PLAY_PLAN_BY_PRODUCT_ID,
  GOOGLE_PLAY_PRODUCT_IDS,
} from '../config/googlePlayBilling';

/**
 * Runs across the entire signed-in app, not only on the Premium page.
 * A completed Play purchase may not reach the in-app callback if the network
 * disappears after checkout; querying owned purchases repairs that gap.
 *
 * This does NOT grant Premium on its own. Only the authenticated backend,
 * after validating a real Google Play purchase token, may grant access.
 */
export default function PlayPurchaseRecovery() {
  const auth = useAuth();
  const { connected } = useIAP();
  const network = Network.useNetworkState();
  const [foregroundRevision, setForegroundRevision] = useState(0);
  const [queuedRevision, setQueuedRevision] = useState(0);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const lastTrigger = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        setForegroundRevision(value => value + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const userId = auth.user?.id;
    const sessionToken = auth.token;

    if (!connected || !userId || !sessionToken || isCurrentPremium(auth.user)) {
      return;
    }
    if (network.isConnected === false || network.isInternetReachable === false) {
      return;
    }

    const trigger = [
      userId,
      sessionToken,
      network.isConnected,
      network.isInternetReachable,
      foregroundRevision,
      queuedRevision,
    ].join(':');

    if (lastTrigger.current === trigger) return;
    lastTrigger.current = trigger;

    if (inFlight.current) {
      queued.current = true;
      return;
    }

    inFlight.current = true;
    void (async () => {
      try {
        if ((await getStoredToken()) !== sessionToken) return;

        // Android returns currently owned subscriptions and one-time purchases.
        // Don't start a new checkout, and never persist a raw token locally.
        const owned = await getAvailablePurchases({ includeSuspendedAndroid: true });
        const candidates = selectRecoverablePlayPurchases(
          owned,
          Object.values(GOOGLE_PLAY_PRODUCT_IDS),
          GOOGLE_PLAY_PRODUCT_IDS.LIFETIME,
        );

        for (const purchase of candidates) {
          if ((await getStoredToken()) !== sessionToken) break;
          const plan = GOOGLE_PLAY_PLAN_BY_PRODUCT_ID[purchase.productId];
          try {
            const verified = await verifyGooglePlayPurchase({
              plan,
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken!,
              packageName: GOOGLE_PLAY_PACKAGE_NAME,
            });

            if (!isCurrentPremium(verified)) continue;
            if ((await getStoredToken()) !== sessionToken) break;
            await auth.applyVerifiedPurchase(verified, String(userId));
          } catch {
            // An expired test purchase, transient API failure or a purchase
            // belonging to another FlexiWalls account must never grant Pro.
            // It can be retried on the next reconnect/foreground event, or
            // explicitly with Restore Purchase.
            console.warn('Google Play owned-purchase recovery could not verify an item.');
          }
        }
      } catch {
        // Offline/store temporarily unavailable: retain Free status and retry.
        console.warn('Google Play owned-purchase recovery is temporarily unavailable.');
      } finally {
        inFlight.current = false;
        if (queued.current) {
          queued.current = false;
          setQueuedRevision(value => value + 1);
        }
      }
    })();
  }, [
    connected,
    auth.user?.id,
    auth.token,
    auth.applyVerifiedPurchase,
    network.isConnected,
    network.isInternetReachable,
    foregroundRevision,
    queuedRevision,
  ]);

  return null;
}
