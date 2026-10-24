import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import * as SecureStore from 'expo-secure-store';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import API from '../services/api';
import { shouldKeepCachedSession } from '../utils/sessionRecovery';

import { googleLogin, logoutUser, getProfile } from '../services/authService';
import { getSubscriptionStatus } from '../services/subscriptionService';
import { isCurrentPremium } from '../utils/premiumStatus';

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

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '941020838367-3p357g930n99gi68aq4inclg6geqjn3c.apps.googleusercontent.com',

      offlineAccess: false,
    });

    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync('token');

      const savedUser = await SecureStore.getItemAsync('user');

      if (!savedToken || !savedUser) {
        // Guest User -> Ads Enabled
        AdController.setPremiumUser(false);

        setLoading(false);
        return;
      }

      // Retain the last authenticated profile during temporary network loss.
      // Every server-side privileged request still validates the session.
      const cachedProfile = JSON.parse(savedUser) as User;
      API.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
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

      delete API.defaults.headers.common.Authorization;

      await SecureStore.deleteItemAsync('token');

      await SecureStore.deleteItemAsync('user');

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
    await SecureStore.setItemAsync('token', jwt);

    await SecureStore.setItemAsync('user', JSON.stringify(profile));

    API.defaults.headers.common.Authorization = `Bearer ${jwt}`;

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

    await SecureStore.deleteItemAsync('token');

    await SecureStore.deleteItemAsync('user');

    delete API.defaults.headers.common.Authorization;

    setToken(null);

    setUser(null);

    // Guest again -> Ads Enabled
    AdController.setPremiumUser(false);
  };

  const refreshProfile = async () => {
    try {
      setLoading(true);

      // Sync verified Google Play entitlement before displaying Free/Pro badges.
      // Failure of status sync should not erase a valid session or cached profile.
      const status = await getSubscriptionStatus().catch(() => null);
      const response = await getProfile();
      const updatedUser = {
        ...response.data,
        isPremium: status ? isCurrentPremium(status) : Boolean(response.data.isPremium &&
          response.data.premiumUntil && Date.parse(response.data.premiumUntil) > Date.now()),
        premiumUntil: status ? status.premiumUntil ?? null : response.data.premiumUntil,
      };
      setUser(updatedUser);
      AdController.setPremiumUser(updatedUser.isPremium);
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    } finally {
      setLoading(false);
    }
  };

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

        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
