import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

import {
  getStoredSession,
  getStoredToken,
  persistSession,
  clearStoredSession,
  persistProfileForToken,
  subscribeToSessionInvalidation,
} from '../services/authSessionStorage';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { shouldKeepCachedSession } from '../utils/sessionRecovery';

import { googleLogin, logoutUser, getProfile } from '../services/authService';
import { getSubscriptionStatus } from '../services/subscriptionService';
import type { SubscriptionStatus } from '../services/subscriptionService';
import { isCurrentPremium } from '../utils/premiumStatus';
import { getAvailablePurchases } from 'expo-iap';
import { verifyGooglePlayPurchase } from '../services/subscriptionService';
import { selectRecoverablePlayPurchases } from '../utils/playPurchaseRecovery';
import {
  GOOGLE_PLAY_PACKAGE_NAME,
  GOOGLE_PLAY_PLAN_BY_PRODUCT_ID,
  GOOGLE_PLAY_PRODUCT_IDS,
} from '../config/googlePlayBilling';

import type { User, Role } from '../services/types';
import AdController from '../ads/AdController';

type AuthContextType = {
  user: User | null;
  token: string | null;

  loading: boolean;
  authLoading: boolean;
  isLoggedIn: boolean;

  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  refreshProfile: () => Promise<void>;
  syncGooglePlayPurchases: () => Promise<boolean>;
  applyVerifiedPurchase: (status: SubscriptionStatus, expectedUserId: string) => Promise<void>;

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);

  // Deduplicate concurrent profile updates triggered by login, focus and resume.
  const profileRefreshInFlight = useRef<Promise<void> | null>(null);
  const playSyncInFlight = useRef<Promise<boolean> | null>(null);

  useEffect(() => subscribeToSessionInvalidation(() => {
    setToken(null);
    setUser(null);
    AdController.setPremiumUser(false);
  }), []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '966374671800-vcb8487op5tc1s7vfbpmqjlkctg90rmd.apps.googleusercontent.com',

      offlineAccess: false,
    });

    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const { token: savedToken, user: savedUser } = await getStoredSession();

      if (!savedToken || !savedUser) {
        // Guest User -> Ads Enabled
        AdController.setPremiumUser(false);

        setLoading(false);
        return;
      }

      // Retain the last authenticated profile during temporary network loss.
      // Every server-side privileged request still validates the session.
      const cachedProfile = JSON.parse(savedUser) as User;
      setToken(savedToken);
      setUser(cachedProfile);
      AdController.setPremiumUser(Boolean(cachedProfile.isPremium));

      try {
        await refreshProfile();
      } catch (error) {
        if (!shouldKeepCachedSession(error)) throw error;
        // Timeout/offline/5xx: leave cached login intact and retry on the next refresh.
        console.warn('Unable to refresh profile while offline; retaining cached session.');
      }
    } catch (error) {
      console.log('RESTORE SESSION ERROR', error);

      await clearStoredSession();

      setToken(null);

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (
    jwt: string,

    profile: User,
  ) => {
    await persistSession(jwt, profile);

    setToken(jwt);

    AdController.setPremiumUser(profile.isPremium);

    await refreshProfile();
  };

  const signInGoogle = async () => {
    setAuthLoading(true);

    try {
      console.log('========== GOOGLE LOGIN ==========');

      await GoogleSignin.hasPlayServices();

      /**
       * Remove previous Google session if exists
       */
      try {
        await GoogleSignin.signOut();
      } catch {}

      console.log('Opening Google Sign In...');

      const result = await GoogleSignin.signIn();


      const idToken = result.data?.idToken;

      if (!idToken) {
        throw new Error('Google ID Token not received');
      }

      console.log('Sending token to backend...');

      const response = await googleLogin(idToken);


      await saveSession(response.data.token, response.data.user);

      console.log('Login Successful');
    } catch (error: any) {
      console.log('========== GOOGLE ERROR ==========');

      console.log(error);

      console.log('Code:', error?.code);

      console.log('Message:', error?.message);

      switch (error?.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          console.log('User cancelled Google Sign In');
          break;

        case statusCodes.IN_PROGRESS:
          console.log('Google Sign In already in progress');
          break;

        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log('Google Play Services unavailable');
          break;

        default:
          console.log('Unknown Google Sign In error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch (error) {
      console.log(error);
    }

    try {
      await GoogleSignin.revokeAccess();
    } catch {}

    try {
      await GoogleSignin.signOut();
    } catch {}

    await clearStoredSession();

    setToken(null);

    setUser(null);

    // Guest again -> Ads Enabled
    AdController.setPremiumUser(false);
  };

  const refreshProfile = useCallback(async (): Promise<void> => {
    // Background refreshes must not toggle the initial app loading state.
    // Otherwise Profile unmounts its content and its focus effect can retrigger.
    if (profileRefreshInFlight.current) {
      return profileRefreshInFlight.current;
    }

    const request = (async () => {
      const sessionToken = await getStoredToken();
      if (!sessionToken) return;
      // A transient subscription status error must not discard a valid profile.
      const status = await getSubscriptionStatus().catch(() => null);
      const response = await getProfile();
      const updatedUser = {
        ...response.data,
        isPremium: status ? isCurrentPremium(status) : Boolean(response.data.isPremium &&
          response.data.premiumUntil && Date.parse(response.data.premiumUntil) > Date.now()),
        premiumUntil: status ? status.premiumUntil ?? null : response.data.premiumUntil,
      };
      await persistProfileForToken(sessionToken, updatedUser, () => {
        setUser(updatedUser);
        AdController.setPremiumUser(updatedUser.isPremium);
      });
    })();

    profileRefreshInFlight.current = request;
    try {
      await request;
    } finally {
      if (profileRefreshInFlight.current === request) {
        profileRefreshInFlight.current = null;
      }
    }
  }, []);


  // Trust only an entitlement that the authenticated backend has verified
  // against Google Play. Apply it immediately, including cached state and ads.
  const applyVerifiedPurchase = useCallback(async (
    status: SubscriptionStatus,
    expectedUserId: string,
  ): Promise<void> => {
    if (!isCurrentPremium(status)) {
      throw new Error('Google Play has not confirmed an active Premium entitlement.');
    }

    // A pre-purchase refresh might have fetched the old Free status.
    // Let it settle first so it cannot overwrite this verified purchase.
    if (profileRefreshInFlight.current) {
      await profileRefreshInFlight.current.catch(() => undefined);
    }

    const { token: currentToken, user: savedUser } = await getStoredSession();
    if (!currentToken || !savedUser) {
      throw new Error('Sign in again before restoring your Google Play purchase.');
    }

    const previousUser = JSON.parse(savedUser) as User;
    if (String(previousUser.id) !== String(expectedUserId)) {
      throw new Error('Your FlexiWalls account changed during purchase verification.');
    }

    const updatedUser: User = {
      ...previousUser,
      isPremium: true,
      premiumUntil: status.premiumUntil ?? status.activeSubscription?.endDate ?? null,
    };

    const saved = await persistProfileForToken(currentToken, updatedUser, () => {
      setUser(updatedUser);
      AdController.setPremiumUser(true);
    });

    if (!saved) {
      throw new Error('The login session changed during purchase verification. Sign in again.');
    }
  }, []);

  /**
   * Explicit user refreshes must ask Google Play about purchases currently
   * owned, not only fetch the backend's last saved Premium state. Never open a
   * checkout; only the backend can verify and grant an entitlement.
   */
  const syncGooglePlayPurchases = useCallback(async (): Promise<boolean> => {
    if (playSyncInFlight.current) return playSyncInFlight.current;

    const request = (async () => {
      const { token: expectedToken, user: savedUser } = await getStoredSession();
      if (!expectedToken || !savedUser) return false;
      const expectedUserId = String((JSON.parse(savedUser) as User).id);
      const purchases = await getAvailablePurchases({ includeSuspendedAndroid: true });
      const owned = selectRecoverablePlayPurchases(
        purchases,
        Object.values(GOOGLE_PLAY_PRODUCT_IDS),
        GOOGLE_PLAY_PRODUCT_IDS.LIFETIME,
      );

      let verifiedAny = false;
      let lastError: unknown = null;
      for (const purchase of owned) {
        if ((await getStoredToken()) !== expectedToken) return false;
        try {
          const status = await verifyGooglePlayPurchase({
            plan: GOOGLE_PLAY_PLAN_BY_PRODUCT_ID[purchase.productId],
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken!,
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
          });
          if (!isCurrentPremium(status)) continue;
          if ((await getStoredToken()) !== expectedToken) return false;
          await applyVerifiedPurchase(status, expectedUserId);
          verifiedAny = true;
        } catch (error) {
          // An old expired test item or an item for a different account must
          // never be used to unlock Premium. Continue to other owned products.
          lastError = error;
        }
      }
      if (!verifiedAny && lastError) throw lastError;
      return verifiedAny;
    })();

    playSyncInFlight.current = request;
    try {
      return await request;
    } finally {
      if (playSyncInFlight.current === request) playSyncInFlight.current = null;
    }
  }, [applyVerifiedPurchase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authLoading,
        isLoggedIn: !!user,

        signInGoogle,
        logout,
        refreshProfile,
        syncGooglePlayPurchases,
        applyVerifiedPurchase,

        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
